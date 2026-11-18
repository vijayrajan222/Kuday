import type { IRazorpayService } from "@application/interfaces/services/IRazorpayService";
import type {
  IAgreementPaymentService,
  CreatePaymentOrderResult,
  VerifyPaymentParams,
} from "@application/interfaces/services/IAgreementPaymentService";

export class RazorpayAgreementPaymentService implements IAgreementPaymentService {
  constructor(private readonly razorpayService: IRazorpayService) {}

  getProviderName(): "razorpay" | "mock" {
    return "razorpay";
  }

  async createOrder(
    receipt: string,
    amountPaise: number,
    notes?: Record<string, string>
  ): Promise<CreatePaymentOrderResult> {
    const order = await this.razorpayService.createOrder({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      provider: "razorpay",
      keyId: this.razorpayService.getKeyId(),
    };
  }

  verifyPayment(params: VerifyPaymentParams): boolean {
    if (!params.signature) {
      return false;
    }
    return this.razorpayService.verifySignature(
      params.orderId,
      params.paymentId,
      params.signature
    );
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    return this.razorpayService.verifyWebhookSignature(rawBody, signature);
  }
}
