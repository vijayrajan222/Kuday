import type { IHandleAgreementWebhookUseCase } from "@application/interfaces/use-case/agreement/IHandleAgreementWebhookUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IAgreementPaymentService } from "@application/interfaces/services/IAgreementPaymentService";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export class HandleAgreementWebhookUseCase implements IHandleAgreementWebhookUseCase {
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
    rawBody: string,
    signature: string,
    eventData: unknown
  ): Promise<{ handled: boolean; message: string }> {
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

    const updated = await this.agreementRepository.update(agreement.id, {
      status: "ready_to_sign",
      payment: {
        required: true,
        payerId: agreement.payment?.payerId || agreement.seekerId,
        amount: agreement.payment?.amount || 0,
        provider: this.paymentService.getProviderName(),
        orderId,
        paymentId: paymentId || agreement.payment?.paymentId || "webhook_captured",
        status: "completed",
      },
    });

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

    return { handled: true, message: "Agreement payment completed via webhook." };
  }
}
