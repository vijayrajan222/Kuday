import { Router, type RequestHandler } from "express";
import { PaymentController } from "@presentation/controller/PaymentController";
import { paymentRateLimiter } from "@presentation/middleware/PaymentRateLimiter";

export function createPaymentRouter(
    paymentController: PaymentController,
    authMiddleware: RequestHandler
): Router {
    const router = Router();

    // Public / semi-public configuration & plans
    router.get("/plans", paymentController.getPlans);
    router.get("/config", paymentController.getConfig);

    // Razorpay Webhook Endpoint (verified via HMAC SHA-256 signature in raw body)
    router.post("/webhook", paymentController.handleWebhook);

    // Protected order creation & signature verification (rate limited)
    router.post(
        "/orders",
        authMiddleware,
        paymentRateLimiter,
        paymentController.createOrder
    );
    router.post(
        "/verify",
        authMiddleware,
        paymentRateLimiter,
        paymentController.verifyPayment
    );

    // Wallet Top-Up Order Creation (Razorpay)
    router.post(
        "/wallet/topup/orders",
        authMiddleware,
        paymentRateLimiter,
        paymentController.createTopUpOrder
    );

    // Direct Subscription Activation using Wallet Balance
    router.post(
        "/subscriptions/pay-with-wallet",
        authMiddleware,
        paymentRateLimiter,
        paymentController.payWithWallet
    );

    // Subscription Management & Refund Flow (Rule 7)
    router.get(
        "/subscriptions/active",
        authMiddleware,
        paymentController.getActiveSubscription
    );
    router.post(
        "/subscriptions/:id/refund",
        authMiddleware,
        paymentRateLimiter,
        paymentController.requestRefund
    );
    router.post(
        "/subscriptions/:id/cancel",
        authMiddleware,
        paymentRateLimiter,
        paymentController.cancelSubscription
    );
    router.post(
        "/subscriptions/:id/retry-refund",
        authMiddleware,
        paymentRateLimiter,
        paymentController.retryRefund
    );

    // Wallet Balance & Ledger History
    router.get(
        "/wallet",
        authMiddleware,
        paymentController.getWallet
    );

    return router;
}
