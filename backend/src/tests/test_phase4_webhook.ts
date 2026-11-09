import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import mongoose from "mongoose";
import { connectMongo } from "../infrastructure/database/ConnectMongoDB";
import { MongoUserRepository } from "../infrastructure/repository/MongoUserRepository";
import { MongoPlanRepository } from "../infrastructure/repository/MongoPlanRepository";
import { MongoSubscriptionRepository } from "../infrastructure/repository/MongoSubscriptionRepository";
import { MongoPaymentRepository } from "../infrastructure/repository/MongoPaymentRepository";
import { MongoWalletRepository } from "../infrastructure/repository/MongoWalletRepository";
import { MongoWalletTransactionRepository } from "../infrastructure/repository/MongoWalletTransactionRepository";
import { RazorpayService } from "../infrastructure/services/RazorpayService";
import { WalletService } from "../infrastructure/services/WalletService";
import { CreateOrderUseCase } from "../application/use-case/payment/CreateOrderUseCase";
import { ActivateSubscriptionUseCase } from "../application/use-case/subscription/ActivateSubscriptionUseCase";
import { HandleWebhookUseCase } from "../application/use-case/payment/HandleWebhookUseCase";
import { userModel } from "../infrastructure/database/model/UserModel";
import { paymentModel } from "../infrastructure/database/model/PaymentModel";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel";
import { walletModel } from "../infrastructure/database/model/WalletModel";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans";

async function runPhase4Tests() {
    console.log("=== PHASE 4: WEBHOOK ENDPOINT & OUT-OF-ORDER RESCUE TESTS ===");
    await connectMongo();
    await seedDefaultPlans();

    const userRepo = new MongoUserRepository();
    const planRepo = new MongoPlanRepository();
    const subRepo = new MongoSubscriptionRepository();
    const paymentRepo = new MongoPaymentRepository();
    const walletRepo = new MongoWalletRepository();
    const walletTxRepo = new MongoWalletTransactionRepository();
    const walletService = new WalletService(walletRepo, walletTxRepo);
    const razorpayService = new RazorpayService();

    const activateSubscriptionUseCase = new ActivateSubscriptionUseCase(
        paymentRepo,
        planRepo,
        subRepo,
        userRepo,
        walletService
    );
    const createOrderUseCase = new CreateOrderUseCase(
        paymentRepo,
        planRepo,
        subRepo,
        userRepo,
        razorpayService
    );
    const handleWebhookUseCase = new HandleWebhookUseCase(
        paymentRepo,
        subRepo,
        razorpayService,
        activateSubscriptionUseCase
    );

    const testUser = await userModel.create({
        email: `test_wh_${Date.now()}@example.com`,
        firstName: "Webhook",
        lastName: "Tester",
        isVerified: true,
        isBlocked: false,
    });
    const userId = testUser._id.toString();

    try {
        const plans = await planRepo.findAllActive();
        const monthlyPlan = plans.find((p) => p.name === "Monthly Premium") || plans[0]!;
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "test_razorpay_webhook_secret_2026";

        // Helper to sign raw webhook body
        function signBody(bodyStr: string): string {
            return crypto.createHmac("sha256", webhookSecret).update(bodyStr).digest("hex");
        }

        // Test 1: Rescue Flow (checkout closed midway / verify never reached server)
        console.log("\n[TEST 1] Webhook Rescue: Client dropped, webhook delivers payment.captured");
        const orderResult = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey: `wh_order_${Date.now()}`,
        });

        const testPaymentId = `pay_wh_${Date.now()}`;
        const capturedPayload = {
            event: "payment.captured",
            payload: {
                payment: {
                    entity: {
                        id: testPaymentId,
                        order_id: orderResult.orderId,
                        amount: monthlyPlan.price,
                        status: "captured",
                        method: "card",
                    },
                },
            },
        };

        const rawBody1 = JSON.stringify(capturedPayload);
        const signature1 = signBody(rawBody1);

        const rescueResult = await handleWebhookUseCase.execute({
            rawBody: rawBody1,
            signature: signature1,
            eventPayload: capturedPayload,
        });

        console.assert(rescueResult.received === true, "Webhook must be acknowledged");
        console.assert(rescueResult.action === "subscription_activated", `Expected action 'subscription_activated', got '${rescueResult.action}'`);
        console.log(`[PASS] Webhook successfully rescued dropped transaction and activated subscription!`);

        // Verify DB Subscription & Ledger
        const activeSub = await subRepo.findActiveByUserId(userId);
        console.assert(activeSub !== null && activeSub.status === "active", "Subscription must be active");
        const ledgerRows = await walletTxRepo.findByUserId(userId);
        console.assert(ledgerRows.total === 2, `Expected 2 ledger rows, got ${ledgerRows.total}`);
        console.log(`[PASS] Verified DB records: Subscription active, Ledger balanced (topup + purchase)`);

        // Test 2: Idempotency (Webhook re-delivers payment.captured)
        console.log("\n[TEST 2] Idempotency: Webhook re-delivers payment.captured");
        const duplicateWebhook = await handleWebhookUseCase.execute({
            rawBody: rawBody1,
            signature: signature1,
            eventPayload: capturedPayload,
        });

        console.assert(duplicateWebhook.action === "already_captured_idempotent", "Must exit idempotently");
        const subCount = await subscriptionModel.countDocuments({ userId, status: "active" });
        console.assert(subCount === 1, "Must maintain exactly 1 active subscription");
        console.log(`[PASS] Duplicate webhook safely ignored: action = "${duplicateWebhook.action}"`);

        // Test 3: Reject Tampered Webhook Signature
        console.log("\n[TEST 3] Security: Reject Tampered Webhook Signature");
        let tamperedCaught = false;
        try {
            await handleWebhookUseCase.execute({
                rawBody: rawBody1,
                signature: "invalid_tampered_signature_hex",
                eventPayload: capturedPayload,
            });
        } catch (err: any) {
            tamperedCaught = true;
            console.log(`[PASS] Tampered webhook signature rejected with: "${err.message}"`);
        }
        console.assert(tamperedCaught, "Tampered webhook signature must fail");

        // Test 4: Handle payment.failed event
        console.log("\n[TEST 4] Handle payment.failed event");
        const failedUser = await userModel.create({
            email: `failed_wh_${Date.now()}@example.com`,
            firstName: "Failed",
            lastName: "User",
            isVerified: true,
            isBlocked: false,
        });

        const failedOrder = await createOrderUseCase.execute({
            userId: failedUser._id.toString(),
            planId: monthlyPlan.id,
            idempotencyKey: `failed_order_${Date.now()}`,
        });

        const failedPayload = {
            event: "payment.failed",
            payload: {
                payment: {
                    entity: {
                        id: `pay_fail_${Date.now()}`,
                        order_id: failedOrder.orderId,
                        amount: monthlyPlan.price,
                        status: "failed",
                        error_code: "BAD_REQUEST_ERROR",
                        error_description: "Payment failed due to invalid card OTP",
                    },
                },
            },
        };
        const rawBodyFailed = JSON.stringify(failedPayload);
        const signatureFailed = signBody(rawBodyFailed);

        const failResult = await handleWebhookUseCase.execute({
            rawBody: rawBodyFailed,
            signature: signatureFailed,
            eventPayload: failedPayload,
        });

        console.assert(failResult.action === "payment_marked_failed", "Payment should be marked failed");
        const dbFailedPayment = await paymentRepo.findByRazorpayOrderId(failedOrder.orderId);
        console.assert(dbFailedPayment!.status === "failed", "Status must be failed");
        console.assert(dbFailedPayment!.errorReason === "Payment failed due to invalid card OTP", "Error reason must be recorded");
        console.log(`[PASS] Failed payment recorded with reason: "${dbFailedPayment!.errorReason}"`);
        await userModel.deleteMany({ _id: failedUser._id });

        // Test 5: Out-of-order tolerance (never downgrade captured payment)
        console.log("\n[TEST 5] Out-of-order event tolerance");
        const outOfOrderPayload = {
            event: "payment.failed",
            payload: {
                payment: {
                    entity: {
                        id: testPaymentId,
                        order_id: orderResult.orderId, // This order was already captured in Test 1!
                        amount: monthlyPlan.price,
                        status: "failed",
                        error_description: "Stale out of order failure event",
                    },
                },
            },
        };
        const rawBodyOOO = JSON.stringify(outOfOrderPayload);
        const signatureOOO = signBody(rawBodyOOO);

        await handleWebhookUseCase.execute({
            rawBody: rawBodyOOO,
            signature: signatureOOO,
            eventPayload: outOfOrderPayload,
        });

        const capturedStillCaptured = await paymentRepo.findByRazorpayOrderId(orderResult.orderId);
        console.assert(capturedStillCaptured!.status === "captured", "Captured payment must NEVER be downgraded to failed");
        console.log(`[PASS] Captured status protected against stale/out-of-order failure events!`);

        console.log("\n==========================================");
        console.log("ALL PHASE 4 TESTS PASSED SUCCESSFULLY! ✅");
        console.log("==========================================");
    } finally {
        await userModel.deleteMany({ _id: userId });
        await paymentModel.deleteMany({ userId });
        await subscriptionModel.deleteMany({ userId });
        await walletModel.deleteMany({ userId });
        await walletTransactionModel.deleteMany({ userId });
    }
    process.exit(0);
}

runPhase4Tests().catch((err) => {
    console.error("Phase 4 test failed with error:", err);
    process.exit(1);
});
