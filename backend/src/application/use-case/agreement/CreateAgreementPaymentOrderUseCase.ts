import type { ICreateAgreementPaymentOrderUseCase } from "@application/interfaces/use-case/agreement/ICreateAgreementPaymentOrderUseCase";
import type { AgreementPaymentOrderResponseDto } from "@application/dto/agreement/AgreementPaymentOrderDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IAgreementPaymentService } from "@application/interfaces/services/IAgreementPaymentService";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import { getAgreementFee } from "@domain/services/agreementFeeCalculator";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class CreateAgreementPaymentOrderUseCase implements ICreateAgreementPaymentOrderUseCase {
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

  async execute(userId: string, agreementId: string): Promise<AgreementPaymentOrderResponseDto> {
    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundError("Agreement not found.");
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new UnauthorizedError("You are not authorized to access this agreement.");
    }

    if (agreement.status === "signed" || agreement.lockedAt) {
      throw new ValidationError("Agreement is already signed and locked.");
    }

    if (agreement.status === "cancelled") {
      throw new ValidationError("Cannot process payment for a cancelled agreement.");
    }

    // Check pending common terms
    if (agreement.pendingCommonTerms?.status === "pending") {
      throw new ValidationError(
        "There are pending adjustments to the base common terms that must be accepted or rejected first."
      );
    }

    // Check unresolved custom clauses
    const unresolvedClauses = (agreement.customClauses || []).filter(
      (c) => c.status === "proposed" || c.status === "countered"
    );
    if (unresolvedClauses.length > 0) {
      throw new ValidationError(
        "All proposed custom clauses must be resolved (accepted or rejected) before proceeding to payment."
      );
    }

    // Fetch parties for fee evaluation
    const [host, seeker] = await Promise.all([
      this.userRepository.findById(agreement.hostId),
      this.userRepository.findById(agreement.seekerId),
    ]);

    if (!host || !seeker) {
      throw new NotFoundError("Host or Seeker profile could not be located.");
    }

    // Calculate agreement fee
    const fee = getAgreementFee(host, seeker);

    // If fee is waived (e.g. seeker has active premium membership)
    if (fee.isWaived || !fee.required) {
      const updated = await this.agreementRepository.update(agreement.id, {
        status: "ready_to_sign",
        payment: {
          required: false,
          payerId: seeker.id,
          amount: 0,
          status: "waived",
        },
      });

      const enriched = await this.enrich(updated || agreement);

      if (this.socketService) {
        if (this.socketService.emitToAgreement) {
          this.socketService.emitToAgreement(agreement.id, "agreement_updated", enriched);
        }
        this.socketService.notifyUser(host.id, "agreement_updated", enriched);
        this.socketService.notifyUser(seeker.id, "agreement_updated", enriched);
      }

      return {
        waived: true,
        waiverReason: fee.waiverReason || "Fee waived for Kuday Premium member.",
        agreement: enriched,
      };
    }

    // If already paid
    if (agreement.payment?.status === "completed") {
      const enriched = await this.enrich(agreement);
      return {
        waived: false,
        agreement: enriched,
      };
    }

    // Only seeker pays the agreement fee
    if (userId !== seeker.id) {
      const enriched = await this.enrich(agreement);
      return {
        waived: false,
        agreement: enriched,
      };
    }

    // Create payment order
    const receipt = `agr_${agreement.id.slice(-8)}_${Date.now().toString().slice(-4)}`;
    const order = await this.paymentService.createOrder(receipt, fee.amountPaise, {
      agreementId: agreement.id,
      payerId: seeker.id,
    });

    const updated = await this.agreementRepository.update(agreement.id, {
      status: "awaiting_payment",
      payment: {
        required: true,
        payerId: seeker.id,
        amount: fee.amount,
        provider: this.paymentService.getProviderName(),
        orderId: order.orderId,
        status: "pending",
      },
    });

    const enriched = await this.enrich(updated || agreement);

    if (this.socketService) {
      if (this.socketService.emitToAgreement) {
        this.socketService.emitToAgreement(agreement.id, "agreement_updated", enriched);
      }
      this.socketService.notifyUser(host.id, "agreement_updated", enriched);
      this.socketService.notifyUser(seeker.id, "agreement_updated", enriched);
    }

    return {
      waived: false,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      provider: order.provider,
      keyId: order.keyId,
      agreement: enriched,
    };
  }
}
