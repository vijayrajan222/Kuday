import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectMongo } from "../infrastructure/database/ConnectMongoDB.js";
import { MongoUserRepository } from "../infrastructure/repository/MongoUserRepository.js";
import { MongoPlanRepository } from "../infrastructure/repository/MongoPlanRepository.js";
import { MongoSubscriptionRepository } from "../infrastructure/repository/MongoSubscriptionRepository.js";
import { MongoPaymentRepository } from "../infrastructure/repository/MongoPaymentRepository.js";
import { MongoWalletRepository } from "../infrastructure/repository/MongoWalletRepository.js";
import { MongoWalletTransactionRepository } from "../infrastructure/repository/MongoWalletTransactionRepository.js";
import { WalletService } from "../infrastructure/services/WalletService.js";
import { RazorpayService } from "../infrastructure/services/RazorpayService.js";

import { CreateOrderUseCase } from "../application/use-case/payment/CreateOrderUseCase.js";
import { CreateTopUpOrderUseCase } from "../application/use-case/payment/CreateTopUpOrderUseCase.js";
import { VerifyPaymentUseCase } from "../application/use-case/payment/VerifyPaymentUseCase.js";
import { ActivateSubscriptionUseCase } from "../application/use-case/subscription/ActivateSubscriptionUseCase.js";
import { HandleWebhookUseCase } from "../application/use-case/payment/HandleWebhookUseCase.js";

import { userModel } from "../infrastructure/database/model/UserModel.js";
import { paymentModel } from "../infrastructure/database/model/PaymentModel.js";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel.js";
import { walletModel } from "../infrastructure/database/model/WalletModel.js";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel.js";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans.js";

async function runPhase5Tests() {
    console.log("==========================================================");
    console.log("=== PHASE 5 TEST: WEBHOOK BACKUP & RESCUE (KUDAI) ===");
    console.log("==========================================================");

    await connectMongo();
    await seedDefaultPlans();
    console.log("✓ Connected to MongoDB Atlas & plans verified\n");

    const userRepo = new MongoUserRepository();
    const planRepo = new MongoPlanRepository();
    const subRepo = new MongoSubscriptionRepository();
    const paymentRepo = new MongoPaymentRepository();
    const walletRepo = new MongoWalletRepository();
    const walletTxRepo = new MongoWalletTransactionRepository();
    const walletService = new WalletService(walletRepo, walletTxRepo);
    const razorpayService = new RazorpayService();

    const activateSubUseCase = new ActivateSubscriptionUseCase(
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

    const createTopUpOrderUseCase = new CreateTopUpOrderUseCase(
        paymentRepo,
        userRepo,
        razorpayService
    );

    const verifyPaymentUseCase = new VerifyPaymentUseCase(
        paymentRepo,
        razorpayService,
        activateSubUseCase,
        walletService
    );

    const handleWebhookUseCase = new HandleWebhookUseCase(
        paymentRepo,
        subRepo,
        razorpayService,
        activateSubUseCase,
        walletService
    );

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "test_razorpay_webhook_secret_2026";

    function computeWebhookSignature(body: string): string {
        return crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
    }

    // Host Monthly Plan
    const plans = await planRepo.findAllActive("host");
    const monthlyPlan = plans.find((p) => p.durationDays === 30)!;

    // Create Test Host
    const testHost = await userModel.create({
        email: `phase5_webhook_host_${Date.now()}@example.com`,
        firstName: "Webhook",
        lastName: "Host",
        hashedPassword: "Password@123",
        role: "host",
        isVerified: true,
        isBlocked: false,
    });
    const userId = testHost._id.toString();
    console.log(`[Setup] Created host user: ${userId}`);

    try {
        // -----------------------------------------------------------------
        // TEST 1: Reject Tampered / Invalid Webhook Signature
        // -----------------------------------------------------------------
        console.log("\n--- TEST 1: Reject Tampered / Invalid Webhook Signature ---");
        const fakePayload = { event: "payment.captured", payload: {} };
        const fakeRawBody = JSON.stringify(fakePayload);

        let tamperedCaught = false;
        try {
            await handleWebhookUseCase.execute({
                rawBody: fakeRawBody,
                signature: "invalid_webhook_signature_1234567890abcdef",
                eventPayload: fakePayload,
            });
        } catch (err: unknown) {
            tamperedCaught = true;
            console.log(`✓ Caught invalid signature error: "${(err as Error).message}"`);
        }
        if (!tamperedCaught) throw new Error("Tampered webhook signature was allowed!");
        console.log("✓ TEST 1 PASSED: Webhook signature security verified.");

        // -----------------------------------------------------------------
        // TEST 2: Rescue Dropped Verify (User closed checkout midway)
        // -----------------------------------------------------------------
        console.log("\n--- TEST 2: Rescue Dropped Verify Connection ---");
        // User created order
        const droppedOrder = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
        });
        console.log(`Order created: ${droppedOrder.orderId}. Simulating client disconnect before verify...`);

        // Razorpay Webhook delivers 'payment.captured'
        const capturedPaymentId = `pay_hook_captured_${Date.now()}`;
        const webhookEvent = {
            event: "payment.captured",
            payload: {
                payment: {
                    entity: {
                        id: capturedPaymentId,
                        order_id: droppedOrder.orderId,
                        amount: monthlyPlan.price,
                        status: "captured",
                        method: "upi",
                    },
                },
            },
        };
        const rawBodyStr = JSON.stringify(webhookEvent);
        const validSignature = computeWebhookSignature(rawBodyStr);

        const webhookResult = await handleWebhookUseCase.execute({
            rawBody: rawBodyStr,
            signature: validSignature,
            eventPayload: webhookEvent,
        });

        if (webhookResult.action !== "subscription_activated") {
            throw new Error(`Expected subscription_activated, got: ${webhookResult.action}`);
        }
        console.log(`✓ Webhook rescued dropped connection: action = "${webhookResult.action}"`);

        // Assert Subscription created and active
        const rescuedSub = await subRepo.findActiveByUserId(userId);
        if (!rescuedSub || rescuedSub.status !== "active") {
            throw new Error("Rescued subscription not found in active status");
        }
        console.log(`✓ Active subscription created: ID = ${rescuedSub.id}, purchasedAt = ${rescuedSub.purchasedAt?.toISOString()}`);

        // Assert Payment transitioned to captured
        const paymentInDb = await paymentRepo.findByRazorpayOrderId(droppedOrder.orderId);
        if (paymentInDb?.status !== "captured" || paymentInDb.razorpayPaymentId !== capturedPaymentId) {
            throw new Error("Payment record status not updated to captured by webhook");
        }
        console.log(`✓ Payment record updated to 'captured' with method: ${paymentInDb.method}`);

        // Assert Ledger rows
        const { transactions } = await walletTxRepo.findByUserId(userId);
        if (transactions.length !== 2) {
            throw new Error(`Expected 2 ledger rows, found: ${transactions.length}`);
        }
        console.log("✓ Exactly 2 ledger entries recorded (topup + premium_purchase)");
        console.log("✓ TEST 2 PASSED: Client disconnect successfully rescued.");

        // -----------------------------------------------------------------
        // TEST 3: Webhook Idempotency (Verify + Webhook both firing)
        // -----------------------------------------------------------------
        console.log("\n--- TEST 3: Webhook Idempotency on Already Captured Order ---");
        const repeatWebhookResult = await handleWebhookUseCase.execute({
            rawBody: rawBodyStr,
            signature: validSignature,
            eventPayload: webhookEvent,
        });

        if (repeatWebhookResult.action !== "already_captured_idempotent") {
            throw new Error(`Expected already_captured_idempotent, got: ${repeatWebhookResult.action}`);
        }

        // Verify no duplicate ledger rows
        const { total: totalTxsAfterRepeat } = await walletTxRepo.findByUserId(userId);
        if (totalTxsAfterRepeat !== 2) {
            throw new Error(`Duplicate ledger rows created! Total: ${totalTxsAfterRepeat}`);
        }
        console.log(`✓ Idempotent exit: action = "${repeatWebhookResult.action}", zero extra ledger rows.`);
        console.log("✓ TEST 3 PASSED: Webhook idempotency verified.");

        // -----------------------------------------------------------------
        // TEST 4: Out-of-Order Safety (Never Downgrade Captured to Failed)
        // -----------------------------------------------------------------
        console.log("\n--- TEST 4: Out-of-Order Event Handling ---");
        const failedEvent = {
            event: "payment.failed",
            payload: {
                payment: {
                    entity: {
                        id: capturedPaymentId,
                        order_id: droppedOrder.orderId,
                        error_description: "Out-of-order delayed failure message",
                    },
                },
            },
        };
        const failedRawBody = JSON.stringify(failedEvent);
        const failedSig = computeWebhookSignature(failedRawBody);

        const outOfOrderResult = await handleWebhookUseCase.execute({
            rawBody: failedRawBody,
            signature: failedSig,
            eventPayload: failedEvent,
        });

        const paymentAfterFail = await paymentRepo.findByRazorpayOrderId(droppedOrder.orderId);
        if (paymentAfterFail?.status !== "captured") {
            throw new Error(`Captured payment was incorrectly downgraded to: ${paymentAfterFail?.status}`);
        }
        console.log(`✓ Out-of-order 'payment.failed' rejected from downgrading: status remains "${paymentAfterFail.status}"`);
        console.log("✓ TEST 4 PASSED: Out-of-order tolerance verified.");

        console.log("\n==========================================================");
        console.log("🎉 ALL PHASE 5 CHECKS PASSED PERFECTLY!");
        console.log("==========================================================");
    } finally {
        await userModel.findByIdAndDelete(userId);
        await walletModel.deleteOne({ userId });
        await walletTransactionModel.deleteMany({ userId });
        await subscriptionModel.deleteMany({ userId });
        await paymentModel.deleteMany({ userId });
        await mongoose.disconnect();
    }
}

runPhase5Tests().catch((err) => {
    console.error("Phase 5 test failed:", err);
    process.exit(1);
});
