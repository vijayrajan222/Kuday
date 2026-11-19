import type { IVerifyAgreementPaymentUseCase } from "@application/interfaces/use-case/agreement/IVerifyAgreementPaymentUseCase";
import type { VerifyAgreementPaymentDto } from "@application/dto/agreement/VerifyAgreementPaymentDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { IWalletService } from "@application/interfaces/services/IWalletService";
import type { IAgreementPaymentService } from "@application/interfaces/services/IAgreementPaymentService";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import { NotFoundError, UnauthorizedError, ValidationError, ConflictError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";
import { activateAgreement } from "./helpers/occupancyHelper";

export class VerifyAgreementPaymentUseCase implements IVerifyAgreementPaymentUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly paymentService: IAgreementPaymentService,
    private readonly socketService?: ISocketNotificationService,
    private readonly interestRepository?: IInterestRepository,
    private readonly walletService?: IWalletService
  ) {}

  async execute(
    userId: string,
    agreementId: string,
    dto: VerifyAgreementPaymentDto
  ): Promise<AgreementResponseDto> {
    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundError("Agreement not found.");
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new UnauthorizedError("You are not authorized to verify payment for this agreement.");
    }

    // Idempotency: If payment was already completed, return agreement immediately
    if (agreement.payment?.status === "completed") {
      return enrichAgreement(agreement, this.userRepository, this.roomRepository);
    }

    // Verify signature with payment provider
    const isValid = this.paymentService.verifyPayment({
      orderId: dto.orderId,
      paymentId: dto.paymentId,
      signature: dto.signature,
    });

    if (!isValid) {
      throw new ValidationError("Payment verification failed. Invalid transaction signature.");
    }

    const { agreement: updated, slotReserved } = await activateAgreement(
      {
        agreementRepository: this.agreementRepository,
        roomRepository: this.roomRepository,
        userRepository: this.userRepository,
        interestRepository: this.interestRepository,
        socketService: this.socketService,
      },
      agreement.id,
      {
        payment: {
          required: true,
          payerId: agreement.payment?.payerId || agreement.seekerId,
          amount: agreement.payment?.amount || 0,
          provider: this.paymentService.getProviderName(),
          orderId: dto.orderId,
          paymentId: dto.paymentId,
          status: "completed",
        },
      }
    );

    if (!slotReserved) {
      // Payment captured, but no room slot available: refund to Kuday wallet and cancel agreement
      const payerId = agreement.payment?.payerId || agreement.seekerId;
      const amountPaise = (agreement.payment?.amount ? agreement.payment.amount * 100 : 25000);

      if (this.walletService) {
        await this.walletService.credit({
          userId: payerId,
          amount: amountPaise,
          reason: "refund",
          referenceId: agreement.id,
          description: "Refund for rental agreement: room occupied by another tenant",
        });
      }

      await this.agreementRepository.update(agreement.id, {
        status: "cancelled",
        payment: {
          ...agreement.payment,
          required: true,
          payerId,
          amount: agreement.payment?.amount || 250,
          provider: this.paymentService.getProviderName(),
          orderId: dto.orderId,
          paymentId: dto.paymentId,
          status: "completed",
        },
        editLock: { userId: null, expiresAt: null },
        pendingWith: null,
      });

      if (this.socketService) {
        this.socketService.notifyUser(payerId, "agreement_updated", {
          id: agreement.id,
          status: "cancelled",
          message: "Room occupied by another tenant. ₹250 refunded to your wallet.",
        });
      }

      throw new ConflictError("This room was just occupied by another tenant. Your payment of ₹250 has been refunded to your Kuday wallet.");
    }

    const enriched = await enrichAgreement(updated, this.userRepository, this.roomRepository);

    if (this.socketService) {
      this.socketService.emitToAgreement?.(agreement.id, "agreement_updated", enriched);
      this.socketService.emitToAgreement?.(agreement.id, "agreement_finalized", enriched);
      this.socketService.notifyUser(agreement.hostId, "agreement_updated", enriched);
      this.socketService.notifyUser(agreement.seekerId, "agreement_updated", enriched);
    }

    return enriched;
  }
}
