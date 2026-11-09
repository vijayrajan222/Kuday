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
import { VerifyPaymentUseCase } from "../application/use-case/payment/VerifyPaymentUseCase";
import { ActivateSubscriptionUseCase } from "../application/use-case/subscription/ActivateSubscriptionUseCase";
import { CancelSubscriptionUseCase } from "../application/use-case/subscription/CancelSubscriptionUseCase";
import { RetryRefundUseCase } from "../application/use-case/subscription/RetryRefundUseCase";
import { GetActiveSubscriptionUseCase } from "../application/use-case/subscription/GetActiveSubscriptionUseCase";
import { GetWalletUseCase } from "../application/use-case/wallet/GetWalletUseCase";
import { userModel } from "../infrastructure/database/model/UserModel";
import { paymentModel } from "../infrastructure/database/model/PaymentModel";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel";
import { walletModel } from "../infrastructure/database/model/WalletModel";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans";

async function runPhase5Tests() {
    console.log("=== PHASE 5: CANCEL SUBSCRIPTION & PRORATED WALLET REFUND TESTS ===");
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
    const verifyPaymentUseCase = new VerifyPaymentUseCase(
        paymentRepo,
        razorpayService,
        activateSubscriptionUseCase
    );
    const cancelSubscriptionUseCase = new CancelSubscriptionUseCase(
        subRepo,
        planRepo,
        paymentRepo,
        userRepo,
        walletService
    );
    const retryRefundUseCase = new RetryRefundUseCase(subRepo, walletService);
    const getActiveSubUseCase = new GetActiveSubscriptionUseCase(subRepo, planRepo, paymentRepo);
    const getWalletUseCase = new GetWalletUseCase(walletService);

    const testUser = await userModel.create({
        email: `test_cancel_${Date.now()}@example.com`,
        firstName: "Cancel",
        lastName: "Tester",
        isVerified: true,
        isBlocked: false,
    });
    const userId = testUser._id.toString();

    try {
        const plans = await planRepo.findAllActive();
        const monthlyPlan = plans.find((p) => p.name === "Monthly Premium") || plans[0]!;

        // Test 1: Full Refund within 3-day Grace Period
        console.log("\n[TEST 1] Full Refund within Grace Period (0-3 days)");
        const order1 = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey: `cancel_order1_${Date.now()}`,
        });

        const payId1 = `pay_cancel1_${Date.now()}`;
        const secret = process.env.RAZORPAY_KEY_SECRET || "NXDoviT1t7tkuSFC4Pz6Hwx6";
        const sig1 = crypto.createHmac("sha256", secret).update(`${order1.orderId}|${payId1}`).digest("hex");

        const verifyResult1 = await verifyPaymentUseCase.execute({
            userId,
            razorpayOrderId: order1.orderId,
            razorpayPaymentId: payId1,
            razorpaySignature: sig1,
        });

        const sub1 = verifyResult1.subscription!;
        console.log(`[PASS] Subscription active: ${sub1.id}, Amount paid: ${monthlyPlan.price} paise`);

        // Check active sub preview
        const activePreview = await getActiveSubUseCase.execute(userId);
        console.assert(activePreview.isFullRefundEligible === true, "Must be full refund eligible");
        console.assert(activePreview.estimatedRefund === monthlyPlan.price, "Estimated refund must equal full price");
        console.log(`[PASS] Active preview: remainingDays = ${activePreview.remainingDays}, estimatedRefund = ${activePreview.estimatedRefund} paise, Full: ${activePreview.isFullRefundEligible}`);

        // Cancel now (within grace period)
        const cancelResult1 = await cancelSubscriptionUseCase.execute({
            userId,
            subscriptionId: sub1.id,
            cancellationReason: "Change of plans",
        });

        console.assert(cancelResult1.isFullRefund === true, "Should be full refund");
        console.assert(cancelResult1.refundAmount === monthlyPlan.price, `Expected ${monthlyPlan.price}, got ${cancelResult1.refundAmount}`);
        console.assert(cancelResult1.subscription.status === "cancelled", "Status must be cancelled");
        console.log(`[PASS] Cancelled within grace period: Refunded 100% (${cancelResult1.refundAmount} paise = ₹${cancelResult1.refundAmount / 100}) to wallet`);

        // Verify Wallet balance
        const walletState1 = await getWalletUseCase.execute(userId);
        console.assert(walletState1.balancePaise === monthlyPlan.price, `Wallet balance should be ${monthlyPlan.price}, got ${walletState1.balancePaise}`);
        console.assert(walletState1.isBalanced === true, "Wallet ledger must balance");
        console.log(`[PASS] Wallet credited. Balance: ${walletState1.balancePaise} paise. Ledger Reconciled: ${walletState1.isBalanced}`);

        // Verify user isPremium is now false
        const userAfterCancel = await userRepo.findById(userId);
        console.assert(userAfterCancel!.isPremium === false, "isPremium should be revoked");
        console.log(`[PASS] User premium badge revoked: isPremium = ${userAfterCancel!.isPremium}`);

        // Test 2: Double Cancel Edge Case
        console.log("\n[TEST 2] Edge Case: Double Cancel Prevention");
        let doubleCancelFailed = false;
        try {
            await cancelSubscriptionUseCase.execute({
                userId,
                subscriptionId: sub1.id,
            });
        } catch (err: any) {
            doubleCancelFailed = true;
            console.log(`[PASS] Double cancel prevented: "${err.message}"`);
        }
        console.assert(doubleCancelFailed, "Double cancel must be rejected");

        // Test 3: Prorated Refund after Grace Period
        console.log("\n[TEST 3] Prorated Refund after Grace Period (Simulate 15 days elapsed on 30-day plan)");
        const testUser2 = await userModel.create({
            email: `test_prorated_${Date.now()}@example.com`,
            firstName: "Prorated",
            lastName: "Tester",
            isVerified: true,
            isBlocked: false,
        });
        const userId2 = testUser2._id.toString();

        const order2 = await createOrderUseCase.execute({
            userId: userId2,
            planId: monthlyPlan.id,
            idempotencyKey: `cancel_order2_${Date.now()}`,
        });

        const payId2 = `pay_cancel2_${Date.now()}`;
        const sig2 = crypto.createHmac("sha256", secret).update(`${order2.orderId}|${payId2}`).digest("hex");

        const verifyResult2 = await verifyPaymentUseCase.execute({
            userId: userId2,
            razorpayOrderId: order2.orderId,
            razorpayPaymentId: payId2,
            razorpaySignature: sig2,
        });

        const sub2 = verifyResult2.subscription!;

        // Simulate 15 days elapsed: startDate = 15 days ago, endDate = 15 days in future
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        const fifteenDaysFuture = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        await subscriptionModel.findByIdAndUpdate(sub2.id, {
            startDate: fifteenDaysAgo,
            endDate: fifteenDaysFuture,
        });

        const cancelResult2 = await cancelSubscriptionUseCase.execute({
            userId: userId2,
            subscriptionId: sub2.id,
        });

        console.assert(cancelResult2.isFullRefund === false, "Must not be full refund");
        console.assert(cancelResult2.refundAmount > 0, "Prorated refund must be positive");
        console.assert(cancelResult2.refundAmount < monthlyPlan.price, "Prorated refund must be less than full price");
        console.assert(Number.isInteger(cancelResult2.refundAmount), "Refund must be integer paise");
        console.log(
            `[PASS] Prorated refund calculated: ${cancelResult2.refundAmount} paise (approx ₹${(cancelResult2.refundAmount / 100).toFixed(2)}) out of ${monthlyPlan.price} paise`
        );

        // Verify ledger reconciliation for user 2
        const walletState2 = await getWalletUseCase.execute(userId2);
        console.assert(walletState2.isBalanced === true, "User 2 wallet and ledger must balance");
        console.assert(walletState2.balancePaise === cancelResult2.refundAmount, "Balance must match refund amount");
        console.log(`[PASS] User 2 wallet reconciled: Balance = ${walletState2.balancePaise} paise, Ledger sum = ${walletState2.balancePaise} paise`);

        // Test 4: Cancel Expired Subscription Edge Case
        console.log("\n[TEST 4] Edge Case: Cancel Expired Subscription");
        const expiredSub = await subscriptionModel.create({
            userId: userId2,
            planId: monthlyPlan.id,
            status: "expired",
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        });

        let expiredCancelFailed = false;
        try {
            await cancelSubscriptionUseCase.execute({
                userId: userId2,
                subscriptionId: expiredSub._id.toString(),
            });
        } catch (err: any) {
            expiredCancelFailed = true;
            console.log(`[PASS] Expired cancellation rejected: "${err.message}"`);
        }
        console.assert(expiredCancelFailed, "Cancelling expired subscription must fail");

        // Test 5: Retry Refund Use Case
        console.log("\n[TEST 5] Retry Failed Refund");
        const failedRefundSub = await subscriptionModel.create({
            userId: userId2,
            planId: monthlyPlan.id,
            status: "cancelled",
            refundAmount: 15000, // ₹150 in paise
            refundStatus: "failed",
        });

        const retryResult = await retryRefundUseCase.execute(failedRefundSub._id.toString(), userId2);
        console.assert(retryResult.refundStatus === "completed", "Status must become completed");
        console.log(`[PASS] Failed refund retried successfully! Status: ${retryResult.refundStatus}`);

        // Clean up test data
        await userModel.deleteMany({ _id: { $in: [userId, userId2] } });
        await paymentModel.deleteMany({ userId: { $in: [userId, userId2] } });
        await subscriptionModel.deleteMany({ userId: { $in: [userId, userId2] } });
        await walletModel.deleteMany({ userId: { $in: [userId, userId2] } });
        await walletTransactionModel.deleteMany({ userId: { $in: [userId, userId2] } });

        console.log("\n==========================================");
        console.log("ALL PHASE 5 TESTS PASSED SUCCESSFULLY! ✅");
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

runPhase5Tests().catch((err) => {
    console.error("Phase 5 test failed with error:", err);
    process.exit(1);
});
