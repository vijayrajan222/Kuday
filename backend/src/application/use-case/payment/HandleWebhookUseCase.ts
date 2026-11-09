import mongoose from "mongoose";
import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { IRazorpayService } from "@application/interfaces/services/IRazorpayService";
import type { IWalletService } from "@application/interfaces/services/IWalletService";
import type { ActivateSubscriptionUseCase } from "@application/use-case/subscription/ActivateSubscriptionUseCase";
import { AppError } from "@application/errors/AppError";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export interface HandleWebhookInput {
    rawBody: string;
    signature: string;
    eventPayload: {
        event: string;
        payload: {
            payment?: {
                entity: {
                    id: string;
                    order_id?: string;
                    amount: number;
                    status: string;
                    method?: string;
                    error_code?: string;
                    error_description?: string;
                };
            };
            refund?: {
                entity: {
                    id: string;
                    payment_id: string;
                    amount: number;
                    status: string;
                };
            };
        };
    };
}

export class HandleWebhookUseCase {
    constructor(
        private readonly paymentRepo: IPaymentRepository,
        private readonly subRepo: ISubscriptionRepository,
        private readonly razorpayService: IRazorpayService,
        private readonly activateSubscriptionUseCase: ActivateSubscriptionUseCase,
        private readonly walletService?: IWalletService
    ) {}

    async execute(input: HandleWebhookInput): Promise<{ received: boolean; action: string }> {
        const { rawBody, signature, eventPayload } = input;

        // 1. Signature Verification using exact raw body
        const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            console.warn("[Webhook] Invalid or tampered webhook signature received from Razorpay!");
            throw new AppError("Invalid webhook signature", HttpStatusCodes.BAD_REQUEST);
        }

        const { event, payload } = eventPayload;
        console.log(`[Webhook] Processing verified event: "${event}"`);

        // 2. Handle 'payment.captured' (Rescue dropped verify connections & handle async captures)
        if (event === "payment.captured" && payload.payment?.entity) {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            if (!orderId) {
                console.warn(`[Webhook] payment.captured received without order_id: ${paymentId}`);
                return { received: true, action: "ignored_no_order_id" };
            }

            const paymentRecord = await this.paymentRepo.findByRazorpayOrderId(orderId);
            if (!paymentRecord) {
                console.warn(`[Webhook] No payment record found for order: ${orderId}`);
                return { received: true, action: "ignored_unknown_order" };
            }

            // Out-of-order check: If already captured and subscription active/wallet credited, do not duplicate
            if (paymentRecord.status === "captured") {
                if (paymentRecord.planId) {
                    const existingSub = await this.subRepo.findActiveByUserId(paymentRecord.userId);
                    if (existingSub && existingSub.paymentId === paymentRecord.id) {
                        console.log(`[Webhook] Order ${orderId} already captured and active. Idempotent exit.`);
                        return { received: true, action: "already_captured_idempotent" };
                    }
                } else {
                    console.log(`[Webhook] Top-up order ${orderId} already captured and credited. Idempotent exit.`);
                    return { received: true, action: "already_captured_idempotent" };
                }
            }

            // A: If order has a planId, activate subscription
            if (paymentRecord.planId) {
                try {
                    await this.activateSubscriptionUseCase.activateFromPayment({
                        userId: paymentRecord.userId,
                        razorpayOrderId: orderId,
                        razorpayPaymentId: paymentId,
                        method: paymentEntity.method,
                    });
                    console.log(`[Webhook] Subscription successfully activated/rescued for order: ${orderId}`);
                    return { received: true, action: "subscription_activated" };
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "";
                    console.error(`[Webhook] Failed activating subscription on webhook: ${msg}`);
                    throw err;
                }
            }

            // B: If top-up (no planId), credit wallet atomically
            if (this.walletService) {
                const session = await mongoose.startSession();
                try {
                    await session.withTransaction(async () => {
                        await this.paymentRepo.updateStatus(
                            paymentRecord.id,
                            "captured",
                            {
                                razorpayPaymentId: paymentId,
                                ...(paymentEntity.method ? { method: paymentEntity.method } : {}),
                            },
                            session
                        );
                        await this.walletService!.credit(
                            {
                                userId: paymentRecord.userId,
                                amount: paymentRecord.amount,
                                reason: "topup",
                                referenceId: paymentRecord.id,
                                description: `Wallet top-up via Razorpay webhook (${paymentId})`,
                            },
                            session
                        );
                    });
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "";
                    if (msg.includes("replica set") || msg.includes("Transaction numbers are only allowed")) {
                        await this.paymentRepo.updateStatus(paymentRecord.id, "captured", {
                            razorpayPaymentId: paymentId,
                            ...(paymentEntity.method ? { method: paymentEntity.method } : {}),
                        });
                        await this.walletService.credit({
                            userId: paymentRecord.userId,
                            amount: paymentRecord.amount,
                            reason: "topup",
                            referenceId: paymentRecord.id,
                            description: `Wallet top-up via Razorpay webhook (${paymentId})`,
                        });
                    } else {
                        throw err;
                    }
                } finally {
                    await session.endSession();
                }
                console.log(`[Webhook] Top-up order ${orderId} successfully captured and wallet credited via webhook`);
                return { received: true, action: "wallet_topped_up" };
            }

            await this.paymentRepo.updateStatus(paymentRecord.id, "captured", {
                razorpayPaymentId: paymentId,
                ...(paymentEntity.method ? { method: paymentEntity.method } : {}),
            });
            return { received: true, action: "payment_captured" };
        }

        // 3. Handle 'payment.failed'
        if (event === "payment.failed" && payload.payment?.entity) {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;

            if (orderId) {
                const paymentRecord = await this.paymentRepo.findByRazorpayOrderId(orderId);
                // Out-of-order tolerance: Never downgrade an already captured payment to failed
                if (paymentRecord && paymentRecord.status !== "captured") {
                    await this.paymentRepo.updateStatus(paymentRecord.id, "failed", {
                        razorpayPaymentId: paymentEntity.id,
                        errorReason: paymentEntity.error_description || "Payment failed on Razorpay",
                    });
                    console.log(`[Webhook] Payment order ${orderId} marked failed: ${paymentEntity.error_description}`);
                    return { received: true, action: "payment_marked_failed" };
                }
            }
            return { received: true, action: "payment_failed_ignored" };
        }

        // 4. Handle 'refund.processed'
        if (event === "refund.processed" && payload.refund?.entity) {
            const refundEntity = payload.refund.entity;
            const paymentId = refundEntity.payment_id;

            const paymentRecord = await this.paymentRepo.findByRazorpayPaymentId(paymentId);
            if (paymentRecord) {
                await this.paymentRepo.updateStatus(paymentRecord.id, "refunded");
                console.log(`[Webhook] Refund processed for payment: ${paymentId}`);
                return { received: true, action: "refund_processed" };
            }
            return { received: true, action: "refund_ignored_not_found" };
        }

        return { received: true, action: "unhandled_event_acknowledged" };
    }
}
