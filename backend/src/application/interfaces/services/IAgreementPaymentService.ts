export interface CreatePaymentOrderResult {
  orderId: string;
  amount: number; // in paise
  currency: string;
  provider: "razorpay" | "mock";
  keyId?: string | undefined;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string | undefined;
}

export interface IAgreementPaymentService {
  getProviderName(): "razorpay" | "mock";
  getKeyId?(): string | undefined;
  createOrder(
    receipt: string,
    amountPaise: number,
    notes?: Record<string, string>
  ): Promise<CreatePaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): boolean;
  verifyWebhook(rawBody: string, signature: string): boolean;
}
