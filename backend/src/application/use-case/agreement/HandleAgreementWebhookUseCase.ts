import type { IHandleAgreementWebhookUseCase } from "@application/interfaces/use-case/agreement/IHandleAgreementWebhookUseCase";
import type {
  HandleAgreementWebhookInputDto,
  HandleAgreementWebhookOutputDto,
} from "@application/dto/agreement/AgreementWebhookDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { ISeekerPreferenceRepository } from "@application/interfaces/repository/ISeekerPreferenceRepository";
import type { IWalletService } from "@application/interfaces/services/IWalletService";
import type { IAgreementPaymentService } from "@application/interfaces/services/IAgreementPaymentService";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import { activateAgreement } from "./helpers/occupancyHelper";

export class HandleAgreementWebhookUseCase implements IHandleAgreementWebhookUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly paymentService: IAgreementPaymentService,
    private readonly socketService?: ISocketNotificationService,
    private readonly interestRepository?: IInterestRepository,
    private readonly walletService?: IWalletService,
    private readonly seekerPreferenceRepository?: ISeekerPreferenceRepository
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
    inputOrRawBody: HandleAgreementWebhookInputDto | string,
    rawSignature?: string,
    rawEventData?: unknown
  ): Promise<HandleAgreementWebhookOutputDto> {
    const rawBody = typeof inputOrRawBody === "object" ? inputOrRawBody.rawBody : inputOrRawBody;
    const signature = typeof inputOrRawBody === "object" ? inputOrRawBody.signature : rawSignature!;
    const eventData = typeof inputOrRawBody === "object" ? inputOrRawBody.eventData : rawEventData;
    // 1. Verify webhook signature
    const isValid = this.paymentService.verifyWebhook(rawBody, signature);
    if (!isValid) {
      return { handled: false, message: "Invalid webhook signature." };
    }

    const payload = eventData as {
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; status?: string } };
        order?: { entity?: { id?: string; status?: string } };
      };
    };

    const event = payload.event;
    if (event !== "payment.captured" && event !== "order.paid") {
      return { handled: true, message: `Ignored unhandled event: ${event}` };
    }

    const orderId =
      payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
    const paymentId = payload.payload?.payment?.entity?.id;

    if (!orderId) {
      return { handled: false, message: "Order ID missing from webhook payload." };
    }

    const agreement = await this.agreementRepository.findByOrderId(orderId);
    if (!agreement) {
      // Event may belong to a membership subscription or wallet top-up, not this agreement
      return { handled: false, message: "No agreement associated with this order ID." };
    }

    // Idempotency: If already completed, nothing to do
    if (agreement.payment?.status === "completed") {
      return { handled: true, message: "Agreement payment already marked as completed." };
    }

    try {
      const { agreement: updated, slotReserved, inactive } = await activateAgreement(
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
            required: true,
            payerId: agreement.payment?.payerId || agreement.seekerId,
            amount: agreement.payment?.amount || 0,
            provider: this.paymentService.getProviderName(),
            orderId,
            paymentId: paymentId || agreement.payment?.paymentId || "webhook_captured",
            status: "completed",
          },
        }
      );

      if (inactive) {
        // Inactive (cancelled/ended): do nothing, no refund, no status change
        return { handled: true, message: "Agreement is already inactive (cancelled/ended)." };
      }

      if (!slotReserved) {
        // Payment captured via webhook, but no room slot was available: refund to wallet and cancel
        const payerId = agreement.payment?.payerId || agreement.seekerId;
        const amountPaise = agreement.payment?.amount ? agreement.payment.amount * 100 : 25000;

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

        return { handled: true, message: "Room occupied by another tenant: agreement cancelled and payment refunded to Kuday wallet." };
      }

      if (updated) {
        const enriched = await this.enrich(updated);
        if (this.socketService) {
          if (this.socketService.emitToAgreement) {
            this.socketService.emitToAgreement(agreement.id, "agreement_updated", enriched);
          }
          this.socketService.notifyUser(agreement.hostId, "agreement_updated", enriched);
          this.socketService.notifyUser(agreement.seekerId, "agreement_updated", enriched);
        }
      }
    } catch {
      return { handled: false, message: "No available slots remaining to fulfill agreement." };
    }

    return { handled: true, message: "Agreement payment completed via webhook." };
  }
}
