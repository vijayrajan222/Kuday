export interface CreateRazorpayOrderOptions {
    amount: number; // Integer in paise
    currency?: string | undefined;
    receipt: string;
    notes?: Record<string, string> | undefined;
}

export interface RazorpayOrderResult {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
}

export interface IRazorpayService {
    createOrder(options: CreateRazorpayOrderOptions): Promise<RazorpayOrderResult>;
    verifySignature(orderId: string, paymentId: string, signature: string): boolean;
    verifyWebhookSignature(rawBody: string, signature: string): boolean;
    fetchPayment(paymentId: string): Promise<{
        id: string;
        orderId?: string | undefined;
        amount: number;
        status: string;
        method?: string | undefined;
        email?: string | undefined;
    }>;
    getKeyId(): string;
}
