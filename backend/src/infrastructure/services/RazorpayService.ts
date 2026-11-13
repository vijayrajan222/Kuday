import crypto from "crypto";
import Razorpay from "razorpay";
import type {
    IRazorpayService,
    CreateRazorpayOrderOptions,
    RazorpayOrderResult,
} from "@application/interfaces/services/IRazorpayService";
import { ApplicationError, ValidationError } from "@application/errors/AppError";

export class RazorpayService implements IRazorpayService {
    private client: Razorpay | null = null;
    private readonly keyId: string;
    private readonly keySecret: string;
    private readonly webhookSecret: string;

    constructor() {
        this.keyId = process.env.RAZORPAY_KEY_ID || "";
        this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

        if (this.keyId && this.keySecret) {
            this.client = new Razorpay({
                key_id: this.keyId,
                key_secret: this.keySecret,
            });
        }
    }

    private getClient(): Razorpay {
        if (!this.client) {
            if (!this.keyId || !this.keySecret) {
                throw new ApplicationError(
                    "Razorpay credentials are not configured in environment variables",
                    500
                );
            }
            this.client = new Razorpay({
                key_id: this.keyId,
                key_secret: this.keySecret,
            });
        }
        return this.client;
    }

    getKeyId(): string {
        return this.keyId;
    }

    async createOrder(options: CreateRazorpayOrderOptions): Promise<RazorpayOrderResult> {
        if (!Number.isInteger(options.amount) || options.amount <= 0) {
            throw new ValidationError("Order amount must be a positive integer in paise");
        }

        const client = this.getClient();
        try {
            const orderPayload: { amount: number; currency: string; receipt: string; notes?: Record<string, string> } = {
                amount: options.amount,
                currency: options.currency || "INR",
                receipt: options.receipt,
            };
            if (options.notes) {
                orderPayload.notes = options.notes;
            }

            const order = (await client.orders.create(orderPayload as never)) as {
                id: string;
                amount: number | string;
                currency: string;
                receipt?: string;
                status: string;
            };

            return {
                id: order.id,
                amount: Number(order.amount),
                currency: order.currency,
                receipt: order.receipt || options.receipt,
                status: order.status,
            };
        } catch (error: unknown) {
            const err = error as { description?: string; message?: string };
            const errorMsg = err.description || err.message || "Failed to create Razorpay order";
            console.error("[Razorpay] Order creation failed:", errorMsg);
            throw new ValidationError(errorMsg);
        }
    }

    verifySignature(orderId: string, paymentId: string, signature: string): boolean {
        if (!orderId || !paymentId || !signature || !this.keySecret) {
            return false;
        }

        try {
            const expectedSignature = crypto
                .createHmac("sha256", this.keySecret)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
            const actualBuffer = Buffer.from(signature, "utf-8");

            if (expectedBuffer.length !== actualBuffer.length) {
                return false;
            }

            return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
        } catch (error) {
            console.error("[Razorpay] Signature verification error:", error);
            return false;
        }
    }

    verifyWebhookSignature(rawBody: string, signature: string): boolean {
        if (!rawBody || !signature || !this.webhookSecret) {
            return false;
        }

        try {
            const expectedSignature = crypto
                .createHmac("sha256", this.webhookSecret)
                .update(rawBody)
                .digest("hex");

            const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
            const actualBuffer = Buffer.from(signature, "utf-8");

            if (expectedBuffer.length !== actualBuffer.length) {
                return false;
            }

            return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
        } catch (error) {
            console.error("[Razorpay] Webhook signature verification error:", error);
            return false;
        }
    }

    async fetchPayment(paymentId: string): Promise<{
        id: string;
        orderId?: string | undefined;
        amount: number;
        status: string;
        method?: string | undefined;
        email?: string | undefined;
    }> {
        const client = this.getClient();
        try {
            const payment = (await client.payments.fetch(paymentId)) as {
                id: string;
                order_id?: string;
                amount: number | string;
                status: string;
                method?: string;
                email?: string;
            };

            return {
                id: payment.id,
                orderId: payment.order_id ?? undefined,
                amount: Number(payment.amount),
                status: payment.status,
                method: payment.method ?? undefined,
                email: payment.email ?? undefined,
            };
        } catch (error: unknown) {
            const err = error as { description?: string; message?: string };
            const errorMsg = err.description || err.message || "Failed to fetch payment details";
            console.error("[Razorpay] Fetch payment failed:", errorMsg);
            throw new ValidationError(errorMsg);
        }
    }
}
