import type { IVerifyAgreementPaymentUseCase } from "@application/interfaces/use-case/agreement/IVerifyAgreementPaymentUseCase";
import type { VerifyAgreementPaymentDto } from "@application/dto/agreement/VerifyAgreementPaymentDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IAgreementPaymentService } from "@application/interfaces/services/IAgreementPaymentService";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";
import { deductRoomVacancy } from "./helpers/occupancyHelper";

export class VerifyAgreementPaymentUseCase implements IVerifyAgreementPaymentUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly paymentService: IAgreementPaymentService,
    private readonly socketService?: ISocketNotificationService
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

    // Update payment record and transition to completed
    const updated = await this.agreementRepository.update(agreement.id, {
      status: "completed",
      lockedAt: new Date().toISOString(),
      payment: {
        required: true,
        payerId: agreement.payment?.payerId || agreement.seekerId,
        amount: agreement.payment?.amount || 0,
        provider: this.paymentService.getProviderName(),
        orderId: dto.orderId,
        paymentId: dto.paymentId,
        status: "completed",
      },
    });

    if (!updated) {
      throw new NotFoundError("Failed to update agreement payment status.");
    }

    await deductRoomVacancy(this.roomRepository, updated.roomId, this.socketService);

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
