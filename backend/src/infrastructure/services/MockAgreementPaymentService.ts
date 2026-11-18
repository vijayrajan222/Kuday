import crypto from "crypto";
import type {
  IAgreementPaymentService,
  CreatePaymentOrderResult,
  VerifyPaymentParams,
} from "@application/interfaces/services/IAgreementPaymentService";

export class MockAgreementPaymentService implements IAgreementPaymentService {
  getProviderName(): "razorpay" | "mock" {
    return "mock";
  }

  async createOrder(
    receipt: string,
    amountPaise: number
  ): Promise<CreatePaymentOrderResult> {
    const orderId = `mock_order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    return {
      orderId,
      amount: amountPaise,
      currency: "INR",
      provider: "mock",
      keyId: "mock_key_test",
    };
  }

  verifyPayment(params: VerifyPaymentParams): boolean {
    // In mock mode, any non-empty payment ID starting with mock_ or pay_ is valid
    return Boolean(params.orderId && params.paymentId);
  }

  verifyWebhook(_rawBody: string, _signature: string): boolean {
    return true;
  }
}
