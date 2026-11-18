import type { IVerifyAgreementPaymentUseCase } from "@application/interfaces/use-case/agreement/IVerifyAgreementPaymentUseCase";
import type { VerifyAgreementPaymentDto } from "@application/dto/agreement/VerifyAgreementPaymentDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IAgreementPaymentService } from "@application/interfaces/services/IAgreementPaymentService";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class VerifyAgreementPaymentUseCase implements IVerifyAgreementPaymentUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly paymentService: IAgreementPaymentService,
    private readonly socketService?: ISocketNotificationService
  ) {}

  private async enrich(agreement: AgreementEntity): Promise<AgreementResponseDto> {
    const [host, seeker, room] = await Promise.all([
      this.userRepository.findById(agreement.hostId),
      this.userRepository.findById(agreement.seekerId),
      this.roomRepository.findById(agreement.roomId),
    ]);

    return {
      ...agreement,
      host: host
        ? {
            id: host.id,
            firstName: host.firstName,
            lastName: host.lastName,
            email: host.email,
            role: host.role || "host",
            selfieUrl: host.selfieUrl,
            isPremium: host.isPremium,
          }
        : undefined,
      seeker: seeker
        ? {
            id: seeker.id,
            firstName: seeker.firstName,
            lastName: seeker.lastName,
            email: seeker.email,
            role: seeker.role || "seeker",
            selfieUrl: seeker.selfieUrl,
            isPremium: seeker.isPremium,
          }
        : undefined,
      room: room
        ? {
            id: room.id,
            title: room.title,
            roomType: room.roomType,
            monthlyRent: room.monthlyRent,
            location: room.location,
            images: room.images || [],
          }
        : undefined,
    };
  }

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
      return this.enrich(agreement);
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

    // Update payment record and transition to ready_to_sign
    const updated = await this.agreementRepository.update(agreement.id, {
      status: "ready_to_sign",
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

    const enriched = await this.enrich(updated);

    if (this.socketService) {
      if (this.socketService.emitToAgreement) {
        this.socketService.emitToAgreement(agreement.id, "agreement_updated", enriched);
      }
      this.socketService.notifyUser(agreement.hostId, "agreement_updated", enriched);
      this.socketService.notifyUser(agreement.seekerId, "agreement_updated", enriched);
    }

    return enriched;
  }
}
