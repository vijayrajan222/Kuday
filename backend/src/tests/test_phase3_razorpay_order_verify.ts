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

import { userModel } from "../infrastructure/database/model/UserModel.js";
import { paymentModel } from "../infrastructure/database/model/PaymentModel.js";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel.js";
import { walletModel } from "../infrastructure/database/model/WalletModel.js";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel.js";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans.js";

async function runPhase3Tests() {
    console.log("==========================================================");
    console.log("=== PHASE 3 TEST: RAZORPAY ORDER + VERIFY (PREMIUM & TOP-UP) ===");
    console.log("==========================================================");

    await connectMongo();
    await seedDefaultPlans();
    console.log("✓ Connected to MongoDB Atlas & plans seeded\n");

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

    // Fetch the Host Monthly Plan
    const plans = await planRepo.findAllActive("host");
    const monthlyPlan = plans.find((p) => p.durationDays === 30)!;

    // 1. Create a Test User starting as "seeker"
    const testUser = await userModel.create({
        email: `phase3_user_${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "HostSeeker",
        hashedPassword: "HashPassword@123",
        role: "seeker",
        isVerified: true,
        isBlocked: false,
    });
    const userId = testUser._id.toString();
    console.log(`[Setup] Created user ${userId} with initial role: "seeker"`);

    try {
        // -----------------------------------------------------------------
        // TEST 1: Rule 2 - Reject non-host from purchasing premium
        // -----------------------------------------------------------------
        console.log("\n--- TEST 1: Reject Non-Host from Purchasing Premium (Rule 2) ---");
        let nonHostRejected = false;
        try {
            await createOrderUseCase.execute({
                userId,
                planId: monthlyPlan.id,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("Only users currently in the host role can purchase premium membership")) {
                nonHostRejected = true;
                console.log(`✓ Caught expected rejection: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!nonHostRejected) {
            throw new Error("Seeker was unexpectedly allowed to create a premium order!");
        }
        console.log("✓ TEST 1 PASSED: Non-host properly rejected server-side.");

        // -----------------------------------------------------------------
        // TEST 2: Host switches to host & creates premium order
        // -----------------------------------------------------------------
        console.log("\n--- TEST 2: Host Creates Premium Order (Rule 3) ---");
        await userRepo.updateUser(userId, { role: "host" });
        console.log("User role updated to: 'host'");

        const idempotencyKey = `idemp_prem_${Date.now()}`;
        const orderResult = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey,
        });

        if (!orderResult.orderId || orderResult.amount !== 49900) {
            throw new Error(`Invalid order response: ${JSON.stringify(orderResult)}`);
        }
        console.log(`✓ Created Razorpay order: ${orderResult.orderId} for ₹${orderResult.amount / 100} (${orderResult.amount} paise)`);

        // Check DB payment record
        const paymentRecord = await paymentRepo.findByRazorpayOrderId(orderResult.orderId);
        if (!paymentRecord || paymentRecord.purpose !== "premium" || paymentRecord.amount !== 49900) {
            throw new Error(`Invalid payment record in DB: ${JSON.stringify(paymentRecord)}`);
        }
        console.log(`✓ Payment record verified in DB: status = "${paymentRecord.status}", purpose = "${paymentRecord.purpose}"`);

        // Test Idempotent order creation: returns same order
        const idempResult = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey,
        });
        if (idempResult.orderId !== orderResult.orderId) {
            throw new Error("Idempotency failed: generated a different orderId");
        }
        console.log(`✓ Idempotency verified: re-request returned identical order ${idempResult.orderId}`);
        console.log("✓ TEST 2 PASSED: Host premium order successfully created.");

        // -----------------------------------------------------------------
        // TEST 3: Wallet Top-Up Order Creation (Rule 6)
        // -----------------------------------------------------------------
        console.log("\n--- TEST 3: Wallet Top-Up Order Creation ---");
        // Rejects < ₹10
        let invalidAmountRejected = false;
        try {
            await createTopUpOrderUseCase.execute({
                userId,
                amountPaise: 500, // ₹5
            });
        } catch (err: unknown) {
            invalidAmountRejected = true;
            console.log(`✓ Caught min amount error: "${(err as Error).message}"`);
        }
        if (!invalidAmountRejected) throw new Error("Amount < ₹10 was allowed!");

        // Valid ₹200 top-up order
        const topupOrder = await createTopUpOrderUseCase.execute({
            userId,
            amountPaise: 20000,
        });
        const topupPayment = await paymentRepo.findByRazorpayOrderId(topupOrder.orderId);
        if (!topupPayment || topupPayment.purpose !== "wallet_topup" || topupPayment.amount !== 20000) {
            throw new Error("Invalid top-up payment record in DB");
        }
        console.log(`✓ Created Top-Up Order: ${topupOrder.orderId} for ₹${topupOrder.amount / 100}, purpose = "${topupPayment.purpose}"`);
        console.log("✓ TEST 3 PASSED: Wallet top-up order creation verified.");

        // -----------------------------------------------------------------
        // TEST 4: HMAC SHA-256 Timing-Safe Verification & Tamper Detection
        // -----------------------------------------------------------------
        console.log("\n--- TEST 4: Timing-Safe Verification & Tamper Detection ---");
        const dummyPaymentId = `pay_mock_${Date.now()}`;
        const tamperedSignature = "invalid_tampered_signature_1234567890abcdef";

        let tamperedCaught = false;
        try {
            await verifyPaymentUseCase.execute({
                userId,
                razorpayOrderId: topupOrder.orderId,
                razorpayPaymentId: dummyPaymentId,
                razorpaySignature: tamperedSignature,
            });
        } catch (err: unknown) {
            tamperedCaught = true;
            console.log(`✓ Tampered signature rejected: "${(err as Error).message}"`);
        }
        if (!tamperedCaught) throw new Error("Tampered signature was not rejected!");

        const failedPayment = await paymentRepo.findByRazorpayOrderId(topupOrder.orderId);
        if (failedPayment?.status !== "failed") {
            throw new Error("Payment record was not marked 'failed' after tampered signature");
        }
        console.log(`✓ Payment marked 'failed' in DB with reason: "${failedPayment.errorReason}"`);

        // Reset status for valid verification
        await paymentModel.findByIdAndUpdate(failedPayment.id, { status: "created", errorReason: "" });

        // Generate genuine HMAC SHA-256 signature
        const secret = process.env.RAZORPAY_KEY_SECRET || "NXDoviT1t7tkuSFC4Pz6Hwx6";
        const validSignature = crypto
            .createHmac("sha256", secret)
            .update(`${topupOrder.orderId}|${dummyPaymentId}`)
            .digest("hex");

        const verifyResult = await verifyPaymentUseCase.execute({
            userId,
            razorpayOrderId: topupOrder.orderId,
            razorpayPaymentId: dummyPaymentId,
            razorpaySignature: validSignature,
        });

        if (!verifyResult.success || verifyResult.status !== "captured") {
            throw new Error("Valid signature verification failed");
        }
        console.log(`✓ Valid signature accepted. Top-up payment captured.`);

        // Verify wallet credited ₹200
        const userWallet = await walletService.getWallet(userId);
        if (userWallet.balance !== 20000) {
            throw new Error(`Expected wallet balance 20000 paise, got ${userWallet.balance}`);
        }
        console.log(`✓ Wallet credited: balance = ₹${userWallet.balance / 100}`);
        console.log("✓ TEST 4 PASSED: HMAC SHA-256 signature validation & tamper defense verified.");

        // -----------------------------------------------------------------
        // TEST 5: Replay Attack Defense & Duplicate Verify Idempotency
        // -----------------------------------------------------------------
        console.log("\n--- TEST 5: Replay Attack Defense & Idempotency ---");
        // Re-verifying the same order is idempotent (already processed)
        const duplicateVerify = await verifyPaymentUseCase.execute({
            userId,
            razorpayOrderId: topupOrder.orderId,
            razorpayPaymentId: dummyPaymentId,
            razorpaySignature: validSignature,
        });
        if (!duplicateVerify.alreadyProcessed) {
            throw new Error("Expected alreadyProcessed flag on duplicate verify");
        }
        console.log("✓ Duplicate verify handled idempotently without duplicate credit.");

        // Replay attack: submitting same dummyPaymentId for the premium order
        let replayCaught = false;
        try {
            const replaySignature = crypto
                .createHmac("sha256", secret)
                .update(`${orderResult.orderId}|${dummyPaymentId}`)
                .digest("hex");

            await verifyPaymentUseCase.execute({
                userId,
                razorpayOrderId: orderResult.orderId,
                razorpayPaymentId: dummyPaymentId,
                razorpaySignature: replaySignature,
            });
        } catch (err: unknown) {
            const msg = (err as Error).message;
            if (msg.includes("already been credited to another order")) {
                replayCaught = true;
                console.log(`✓ Replay attack detected and rejected: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!replayCaught) throw new Error("Replay attack was not rejected!");
        console.log("✓ TEST 5 PASSED: Replay attack defense verified.");

        console.log("\n==========================================================");
        console.log("🎉 ALL PHASE 3 CHECKS PASSED PERFECTLY!");
        console.log("==========================================================");
    } finally {
        // Cleanup
        await userModel.findByIdAndDelete(userId);
        await walletModel.deleteOne({ userId });
        await walletTransactionModel.deleteMany({ userId });
        await subscriptionModel.deleteMany({ userId });
        await paymentModel.deleteMany({ userId });
        await mongoose.disconnect();
    }
}

runPhase3Tests().catch((err) => {
    console.error("Phase 3 test failed:", err);
    process.exit(1);
});
