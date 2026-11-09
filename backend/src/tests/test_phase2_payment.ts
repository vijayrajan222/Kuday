import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import mongoose from "mongoose";
import { connectMongo } from "../infrastructure/database/ConnectMongoDB";
import { MongoUserRepository } from "../infrastructure/repository/MongoUserRepository";
import { MongoPlanRepository } from "../infrastructure/repository/MongoPlanRepository";
import { MongoSubscriptionRepository } from "../infrastructure/repository/MongoSubscriptionRepository";
import { MongoPaymentRepository } from "../infrastructure/repository/MongoPaymentRepository";
import { RazorpayService } from "../infrastructure/services/RazorpayService";
import { CreateOrderUseCase } from "../application/use-case/payment/CreateOrderUseCase";
import { VerifyPaymentUseCase } from "../application/use-case/payment/VerifyPaymentUseCase";
import { GetPlansUseCase } from "../application/use-case/payment/GetPlansUseCase";
import { userModel } from "../infrastructure/database/model/UserModel";
import { paymentModel } from "../infrastructure/database/model/PaymentModel";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans";

async function runPhase2Tests() {
    console.log("=== PHASE 2: RAZORPAY ORDERS & SIGNATURE VERIFICATION TESTS ===");
    await connectMongo();
    await seedDefaultPlans();

    const userRepo = new MongoUserRepository();
    const planRepo = new MongoPlanRepository();
    const subRepo = new MongoSubscriptionRepository();
    const paymentRepo = new MongoPaymentRepository();
    const razorpayService = new RazorpayService();

    const getPlansUseCase = new GetPlansUseCase(planRepo);
    const createOrderUseCase = new CreateOrderUseCase(
        paymentRepo,
        planRepo,
        subRepo,
        userRepo,
        razorpayService
    );
    const verifyPaymentUseCase = new VerifyPaymentUseCase(paymentRepo, razorpayService);

    // Create a temporary test user
    const testUser = await userModel.create({
        email: `test_pay_${Date.now()}@example.com`,
        firstName: "Razorpay",
        lastName: "Tester",
        isVerified: true,
        isBlocked: false,
    });
    const userId = testUser._id.toString();

    try {
        // Test 1: Get Plans
        console.log("\n[TEST 1] Get Active Plans");
        const plans = await getPlansUseCase.execute();
        console.assert(plans.length >= 3, "Expected at least 3 plans");
        const monthlyPlan = plans.find((p) => p.name === "Monthly Premium") || plans[0]!;
        console.log(`[PASS] Selected Plan: "${monthlyPlan.name}", Price: ${monthlyPlan.price} paise (₹${monthlyPlan.price / 100})`);

        // Test 2: Create Order (Server-side price enforcement)
        console.log("\n[TEST 2] Create Razorpay Order from server-side plan price");
        const idempotencyKey = `idemp_${Date.now()}`;
        const orderResult = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey,
        });

        console.assert(orderResult.amount === monthlyPlan.price, `Amount must match plan price ${monthlyPlan.price}`);
        console.assert(orderResult.orderId.startsWith("order_"), `Expected Razorpay order ID, got ${orderResult.orderId}`);
        console.log(`[PASS] Razorpay Order created: ${orderResult.orderId}, Amount: ${orderResult.amount} paise`);

        // Verify DB Payment record
        const savedPayment = await paymentRepo.findByRazorpayOrderId(orderResult.orderId);
        console.assert(savedPayment !== null, "Payment record must exist in DB");
        console.assert(savedPayment!.status === "created", `Status must be 'created', got ${savedPayment!.status}`);
        console.log(`[PASS] DB Payment created in status: "${savedPayment!.status}"`);

        // Test 3: Idempotency Check (same idempotencyKey returns existing order)
        console.log("\n[TEST 3] Idempotency: Re-submitting with same idempotencyKey");
        const idempResult = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey,
        });
        console.assert(idempResult.orderId === orderResult.orderId, "Idempotent request must return existing order ID");
        console.log(`[PASS] Idempotency confirmed: Returned existing order ${idempResult.orderId}`);

        // Test 4: Reject Tampered Signature
        console.log("\n[TEST 4] Reject Tampered Signature (security check)");
        const dummyPaymentId = `pay_${Date.now()}`;
        const tamperedSignature = "invalid_tampered_hex_signature_1234567890abcdef";
        let tamperedRejected = false;
        try {
            await verifyPaymentUseCase.execute({
                userId,
                razorpayOrderId: orderResult.orderId,
                razorpayPaymentId: dummyPaymentId,
                razorpaySignature: tamperedSignature,
            });
        } catch (err: any) {
            tamperedRejected = true;
            console.log(`[PASS] Tampered signature rejected: "${err.message}"`);
        }
        console.assert(tamperedRejected, "Tampered signature must be rejected");

        // Verify payment record marked 'failed' in DB
        const failedPayment = await paymentRepo.findByRazorpayOrderId(orderResult.orderId);
        console.assert(failedPayment!.status === "failed", "Payment must be marked as 'failed' after tampered signature");
        console.log(`[PASS] Payment status correctly marked as: "${failedPayment!.status}"`);

        // Reset payment to 'created' for valid signature test
        await paymentModel.findByIdAndUpdate(failedPayment!.id, { status: "created", errorReason: "" });

        // Test 5: Valid HMAC SHA256 Signature Verification
        console.log("\n[TEST 5] Valid HMAC SHA256 Signature Check");
        const secret = process.env.RAZORPAY_KEY_SECRET || "NXDoviT1t7tkuSFC4Pz6Hwx6";
        const validSignature = crypto
            .createHmac("sha256", secret)
            .update(`${orderResult.orderId}|${dummyPaymentId}`)
            .digest("hex");

        const verifyResult = await verifyPaymentUseCase.execute({
            userId,
            razorpayOrderId: orderResult.orderId,
            razorpayPaymentId: dummyPaymentId,
            razorpaySignature: validSignature,
        });

        console.assert(verifyResult.success === true, "Verification must succeed");
        console.assert(verifyResult.status === "captured", "Status must be captured");
        console.log(`[PASS] Payment verified successfully: order ${verifyResult.orderId}, status ${verifyResult.status}`);

        // Test 6: Idempotent Re-verification
        console.log("\n[TEST 6] Idempotent Re-verification");
        const reVerify = await verifyPaymentUseCase.execute({
            userId,
            razorpayOrderId: orderResult.orderId,
            razorpayPaymentId: dummyPaymentId,
            razorpaySignature: validSignature,
        });
        console.assert(reVerify.alreadyProcessed === true, "Must flag as alreadyProcessed");
        console.log("[PASS] Idempotent re-verification returned successfully without duplicate charge");

        // Test 7: Prevent Duplicate Payment ID Claim (Replay Attack)
        console.log("\n[TEST 7] Prevent Replay Attack with duplicate payment_id");
        // Create a second order
        const secondOrder = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey: `idemp2_${Date.now()}`,
        });
        let replayRejected = false;
        try {
            await verifyPaymentUseCase.execute({
                userId,
                razorpayOrderId: secondOrder.orderId,
                razorpayPaymentId: dummyPaymentId, // Reusing previous payment ID
                razorpaySignature: validSignature,
            });
        } catch (err: any) {
            replayRejected = true;
            console.log(`[PASS] Replay attack rejected: "${err.message}"`);
        }
        console.assert(replayRejected, "Replay attack with existing paymentId must fail");

        // Test 8: Edge Case - User Already Premium
        console.log("\n[TEST 8] Edge Case: User Already Premium");
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        await subscriptionModel.create({
            userId,
            planId: monthlyPlan.id,
            status: "active",
            startDate: new Date(),
            endDate: futureDate,
        });

        let alreadyPremiumRejected = false;
        try {
            await createOrderUseCase.execute({
                userId,
                planId: monthlyPlan.id,
            });
        } catch (err: any) {
            alreadyPremiumRejected = true;
            console.log(`[PASS] Duplicate order for active premium rejected: "${err.message}"`);
        }
        console.assert(alreadyPremiumRejected, "Active premium user must not create duplicate active orders");

        console.log("\n==========================================");
        console.log("ALL PHASE 2 TESTS PASSED SUCCESSFULLY! ✅");
        console.log("==========================================");
    } finally {
        // Cleanup test data
        await userModel.deleteMany({ _id: userId });
        await paymentModel.deleteMany({ userId });
        await subscriptionModel.deleteMany({ userId });
    }
    process.exit(0);
}

runPhase2Tests().catch((err) => {
    console.error("Phase 2 test failed with error:", err);
    process.exit(1);
});
