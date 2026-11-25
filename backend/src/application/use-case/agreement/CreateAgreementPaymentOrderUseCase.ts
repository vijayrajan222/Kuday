import type { ICreateAgreementPaymentOrderUseCase } from "@application/interfaces/use-case/agreement/ICreateAgreementPaymentOrderUseCase";
import type { AgreementPaymentOrderResponseDto } from "@application/dto/agreement/AgreementPaymentOrderDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { ISeekerPreferenceRepository } from "@application/interfaces/repository/ISeekerPreferenceRepository";
import type { IAgreementPaymentService } from "@application/interfaces/services/IAgreementPaymentService";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import { getAgreementFee } from "@domain/services/agreementFeeCalculator";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";
import { activateAgreement } from "./helpers/occupancyHelper";

export class CreateAgreementPaymentOrderUseCase implements ICreateAgreementPaymentOrderUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly paymentService: IAgreementPaymentService,
    private readonly socketService?: ISocketNotificationService,
    private readonly interestRepository?: IInterestRepository,
    private readonly seekerPreferenceRepository?: ISeekerPreferenceRepository
  ) {}

  async execute(userId: string, agreementId: string): Promise<AgreementPaymentOrderResponseDto> {
    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundError("Agreement not found.");
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new UnauthorizedError("You are not authorized to access this agreement.");
    }

    if (agreement.status === "completed" || agreement.lockedAt) {
      throw new ValidationError("Agreement is already finalized and completed.");
    }

    if (agreement.status === "cancelled") {
      throw new ValidationError("Cannot process payment for a cancelled agreement.");
    }

    // Fetch parties for fee evaluation
    const [host, seeker] = await Promise.all([
      this.userRepository.findById(agreement.hostId),
      this.userRepository.findById(agreement.seekerId),
    ]);

    if (!host || !seeker) {
      throw new NotFoundError("Host or Seeker profile could not be located.");
    }

    const room = await this.roomRepository.findById(agreement.roomId);
    if (!room || (room.availableSlots ?? 0) <= 0) {
      throw new ValidationError("No available slots remaining for this room.");
    }

    // Calculate agreement fee
    const fee = getAgreementFee(host, seeker);

    // If fee is waived (e.g. seeker has active subscription)
    if (fee.isWaived || !fee.required) {
      const { agreement: updated, slotReserved } = await activateAgreement(
        {
          agreementRepository: this.agreementRepository,
          roomRepository: this.roomRepository,
          userRepository: this.userRepository,
          interestRepository: this.interestRepository,
          seekerPreferenceRepository: this.seekerPreferenceRepository,
          socketService: this.socketService,
        },
        agreement.id,
        {
          payment: {
            required: false,
            payerId: seeker.id,
            amount: 0,
            status: "waived",
          },
        }
      );

      if (!slotReserved) {
        throw new ValidationError("No available slots remaining for this room.");
      }

      const enriched = await enrichAgreement(updated || agreement, this.userRepository, this.roomRepository);

      if (this.socketService) {
        this.socketService.emitToAgreement?.(agreement.id, "agreement_updated", enriched);
        this.socketService.emitToAgreement?.(agreement.id, "agreement_finalized", enriched);
        this.socketService.notifyUser(host.id, "agreement_updated", enriched);
        this.socketService.notifyUser(seeker.id, "agreement_updated", enriched);
      }

      return {
        waived: true,
        waiverReason: fee.waiverReason || "Fee waived for Kuday subscriber.",
        agreement: enriched,
      };
    }

    // If already paid
    if (agreement.payment?.status === "completed") {
      const enriched = await enrichAgreement(agreement, this.userRepository, this.roomRepository);
      return {
        waived: false,
        agreement: enriched,
      };
    }

    // Only seeker pays the agreement fee
    if (userId !== seeker.id) {
      const enriched = await enrichAgreement(agreement, this.userRepository, this.roomRepository);
      return {
        waived: false,
        agreement: enriched,
      };
    }

    // Generate or reuse order with payment service abstraction
    let orderId = agreement.payment?.orderId;
    let providerName = agreement.payment?.provider || this.paymentService.getProviderName();

    let keyId: string | undefined;

    if (!orderId || agreement.payment?.provider !== this.paymentService.getProviderName()) {
      const receipt = `agr_${agreement.id.slice(-8)}_${Date.now().toString().slice(-4)}`;
      const order = await this.paymentService.createOrder(
        receipt,
        fee.amountPaise,
        {
          agreementId: agreement.id,
          seekerId: seeker.id,
          hostId: host.id,
          roomId: agreement.roomId,
        }
      );

      orderId = order.orderId;
      providerName = order.provider;
      keyId = order.keyId;

      await this.agreementRepository.update(agreement.id, {
        status: "awaiting_payment",
        payment: {
          required: true,
          payerId: seeker.id,
          amount: fee.amount,
          provider: providerName,
          orderId,
          status: "pending",
        },
      });
    }

    const updated = await this.agreementRepository.findById(agreement.id);
    const enriched = await enrichAgreement(updated || agreement, this.userRepository, this.roomRepository);

    keyId = keyId || this.paymentService.getKeyId?.();

    return {
      waived: false,
      orderId,
      amount: fee.amountPaise,
      currency: "INR",
      provider: providerName,
      keyId,
      agreement: enriched,
    };
  }
}
