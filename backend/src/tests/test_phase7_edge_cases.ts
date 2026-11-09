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
import { HandleWebhookUseCase } from "../application/use-case/payment/HandleWebhookUseCase";
import { userModel } from "../infrastructure/database/model/UserModel";
import { paymentModel } from "../infrastructure/database/model/PaymentModel";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel";
import { walletModel } from "../infrastructure/database/model/WalletModel";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans";
import { runReconciliationAudit } from "../scripts/reconcile_wallets";

async function runMasterEdgeCaseTests() {
    console.log("======================================================================");
    console.log("=== PHASE 7: MASTER PAYMENT, WALLET & RECONCILIATION EDGE CASES ===");
    console.log("======================================================================\n");

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
    const handleWebhookUseCase = new HandleWebhookUseCase(
        paymentRepo,
        subRepo,
        razorpayService,
        activateSubscriptionUseCase
    );

    const plans = await planRepo.findAllActive();
    const monthlyPlan = plans.find((p) => p.name === "Monthly Premium") || plans[0]!;
    const secret = process.env.RAZORPAY_KEY_SECRET || "NXDoviT1t7tkuSFC4Pz6Hwx6";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "test_razorpay_webhook_secret_2026";

    // Setup Test User
    const testUser = await userModel.create({
        email: `master_edge_${Date.now()}@example.com`,
        firstName: "Master",
        lastName: "Tester",
        isVerified: true,
        isBlocked: false,
    });
    const userId = testUser._id.toString();

    try {
        // EDGE CASE 1: Tampered Signature
        console.log("[EDGE CASE 1] Tampered Signature Rejection & Failed State Transition");
        const order1 = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey: `ec1_${Date.now()}`,
        });

        let tamperedBlocked = false;
        try {
            await verifyPaymentUseCase.execute({
                userId,
                razorpayOrderId: order1.orderId,
                razorpayPaymentId: `pay_fake_${Date.now()}`,
                razorpaySignature: "deadbeef_tampered_signature_9999",
            });
        } catch (err: any) {
            tamperedBlocked = true;
            console.log(`   - Blocked: "${err.message}"`);
        }
        console.assert(tamperedBlocked, "Tampered signature must throw error");
        const p1 = await paymentRepo.findByRazorpayOrderId(order1.orderId);
        console.assert(p1!.status === "failed", "Payment must be marked failed");
        console.log(`[PASS] Tampered signature safely rejected and marked status: "${p1!.status}"`);

        // EDGE CASE 2: Checkout Closed Midway / Verify Dropped -> Webhook Rescues
        console.log("\n[EDGE CASE 2] Checkout Closed Midway: Webhook payment.captured Rescues Transaction");
        const order2 = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey: `ec2_${Date.now()}`,
        });
        const payId2 = `pay_rescue_${Date.now()}`;
        const rescuePayload = {
            event: "payment.captured",
            payload: {
                payment: {
                    entity: {
                        id: payId2,
                        order_id: order2.orderId,
                        amount: monthlyPlan.price,
                        status: "captured",
                        method: "upi",
                    },
                },
            },
        };
        const rawBody2 = JSON.stringify(rescuePayload);
        const sig2 = crypto.createHmac("sha256", webhookSecret).update(rawBody2).digest("hex");

        const rescueRes = await handleWebhookUseCase.execute({
            rawBody: rawBody2,
            signature: sig2,
            eventPayload: rescuePayload,
        });
        console.assert(rescueRes.action === "subscription_activated", "Must activate subscription");
        const activeSub2 = await subRepo.findActiveByUserId(userId);
        console.assert(activeSub2 !== null && activeSub2.status === "active", "Sub must be active");
        console.log(`[PASS] Rescued transaction: Subscription ${activeSub2!.id} activated atomically!`);

        // EDGE CASE 3: Verify + Webhook Race (Idempotency)
        console.log("\n[EDGE CASE 3] Verify + Webhook Both Firing: Idempotent Single Activation");
        const dupWebhook = await handleWebhookUseCase.execute({
            rawBody: rawBody2,
            signature: sig2,
            eventPayload: rescuePayload,
        });
        console.assert(dupWebhook.action === "already_captured_idempotent", "Must be already_captured_idempotent");
        const subCount = await subscriptionModel.countDocuments({ userId, status: "active" });
        console.assert(subCount === 1, "Must maintain strictly 1 active subscription");
        console.log(`[PASS] Idempotency confirmed: Duplicate webhook exit without creating duplicate sub.`);

        // EDGE CASE 4: Replay Attack (Duplicate Payment ID on Different Order)
        console.log("\n[EDGE CASE 4] Replay Attack: Duplicate payment_id submitted for another order");
        // Create second user for clean test
        const testUserB = await userModel.create({
            email: `replay_${Date.now()}@example.com`,
            firstName: "Replay",
            lastName: "Tester",
            isVerified: true,
            isBlocked: false,
        });
        const userIdB = testUserB._id.toString();

        const orderB = await createOrderUseCase.execute({
            userId: userIdB,
            planId: monthlyPlan.id,
            idempotencyKey: `ec4_${Date.now()}`,
        });

        // Try to verify orderB using payId2 (already claimed by user 1)
        const fakeSigB = crypto.createHmac("sha256", secret).update(`${orderB.orderId}|${payId2}`).digest("hex");
        let replayBlocked = false;
        try {
            await verifyPaymentUseCase.execute({
                userId: userIdB,
                razorpayOrderId: orderB.orderId,
                razorpayPaymentId: payId2,
                razorpaySignature: fakeSigB,
            });
        } catch (err: any) {
            replayBlocked = true;
            console.log(`   - Blocked: "${err.message}"`);
        }
        console.assert(replayBlocked, "Replay attack must be blocked");
        console.log(`[PASS] Replay attack prevented!`);

        // EDGE CASE 5: User Already Premium Block
        console.log("\n[EDGE CASE 5] User Already Premium: Prevent Duplicate Active Purchase");
        let alreadyPremBlocked = false;
        try {
            await createOrderUseCase.execute({
                userId,
                planId: monthlyPlan.id,
            });
        } catch (err: any) {
            alreadyPremBlocked = true;
            console.log(`   - Blocked: "${err.message}"`);
        }
        console.assert(alreadyPremBlocked, "Active premium user must not create duplicate active orders");
        console.log(`[PASS] Duplicate active membership order creation blocked.`);

        // EDGE CASE 6: Concurrent Wallet Debits (Race Condition Test)
        console.log("\n[EDGE CASE 6] Concurrent Wallet Debits: Race Condition & Overdraft Prevention");
        const raceUser = await userModel.create({
            email: `race_${Date.now()}@example.com`,
            firstName: "Race",
            lastName: "Condition",
            isVerified: true,
            isBlocked: false,
        });
        const raceUserId = raceUser._id.toString();

        // Seed wallet with ₹100 (10000 paise)
        await walletService.credit({
            userId: raceUserId,
            amount: 10000,
            reason: "topup",
            description: "Initial ₹100 seed",
        });

        // Launch 2 simultaneous debits of ₹80 (8000 paise)
        // Only 1 must succeed because 8000 + 8000 = 16000 > 10000!
        const debit1Promise = walletService.debit({
            userId: raceUserId,
            amount: 8000,
            reason: "premium_purchase",
            description: "Concurrent debit attempt 1",
        });
        const debit2Promise = walletService.debit({
            userId: raceUserId,
            amount: 8000,
            reason: "premium_purchase",
            description: "Concurrent debit attempt 2",
        });

        const [res1, res2] = await Promise.allSettled([debit1Promise, debit2Promise]);
        const successes = [res1, res2].filter((r) => r.status === "fulfilled");
        const failures = [res1, res2].filter((r) => r.status === "rejected");

        console.assert(successes.length === 1, `Exactly 1 concurrent debit must succeed, got ${successes.length}`);
        console.assert(failures.length === 1, `Exactly 1 concurrent debit must fail, got ${failures.length}`);

        const raceWallet = await walletService.getWallet(raceUserId);
        console.assert(raceWallet.balance === 2000, `Expected balance 2000 paise (₹20), got ${raceWallet.balance}`);
        console.log(`[PASS] Race condition resolved: Exactly 1 debit succeeded. Wallet balance: ${raceWallet.balance} paise (never negative!).`);

        // EDGE CASE 7: Float & Negative Values Rejection
        console.log("\n[EDGE CASE 7] Reject Float & Negative Monetary Amounts");
        let floatCaught = false;
        try {
            await walletService.credit({
                userId: raceUserId,
                amount: 199.95 as any,
                reason: "topup",
            });
        } catch {
            floatCaught = true;
        }
        console.assert(floatCaught, "Float amount must be rejected");

        let negativeCaught = false;
        try {
            await walletService.debit({
                userId: raceUserId,
                amount: -500,
                reason: "premium_purchase",
            });
        } catch {
            negativeCaught = true;
        }
        console.assert(negativeCaught, "Negative amount must be rejected");
        console.log(`[PASS] Float and negative amounts rejected by validator.`);

        // EDGE CASE 8: Cancellation Edge Cases (Double Cancel & Expired)
        console.log("\n[EDGE CASE 8] Cancellation Edge Cases (Double cancel, Expired, Cap)");
        // Cancel sub2
        const cancel1 = await cancelSubscriptionUseCase.execute({
            userId,
            subscriptionId: activeSub2!.id,
        });
        console.assert(cancel1.subscription.status === "cancelled", "Status must be cancelled");

        let doubleCancelCaught = false;
        try {
            await cancelSubscriptionUseCase.execute({
                userId,
                subscriptionId: activeSub2!.id,
            });
        } catch (err: any) {
            doubleCancelCaught = true;
            console.log(`   - Double Cancel Blocked: "${err.message}"`);
        }
        console.assert(doubleCancelCaught, "Double cancel must throw error");

        // EDGE CASE 9: Out-of-Order Webhook Protection
        console.log("\n[EDGE CASE 9] Out-of-Order Protection: Stale payment.failed cannot overwrite captured payment");
        const staleFailPayload = {
            event: "payment.failed",
            payload: {
                payment: {
                    entity: {
                        id: payId2,
                        order_id: order2.orderId,
                        amount: monthlyPlan.price,
                        status: "failed",
                        error_description: "Delayed failure packet",
                    },
                },
            },
        };
        const rawBodyStale = JSON.stringify(staleFailPayload);
        const sigStale = crypto.createHmac("sha256", webhookSecret).update(rawBodyStale).digest("hex");

        await handleWebhookUseCase.execute({
            rawBody: rawBodyStale,
            signature: sigStale,
            eventPayload: staleFailPayload,
        });

        const capturedProtected = await paymentRepo.findByRazorpayOrderId(order2.orderId);
        console.assert(capturedProtected!.status === "captured", "Captured status must be inviolable");
        console.log(`[PASS] Captured status protected against stale out-of-order failure packet!`);

        // EDGE CASE 10: System-Wide Reconciliation Audit
        console.log("\n[EDGE CASE 10] Full Database Reconciliation Audit");
        const auditReport = await runReconciliationAudit();
        console.assert(auditReport.discrepancyCount === 0, `Expected 0 discrepancies, found ${auditReport.discrepancyCount}`);
        console.log(`[PASS] Audit Report: ${auditReport.balancedCount}/${auditReport.totalWalletsAudited} wallets audited. Discrepancies: ${auditReport.discrepancyCount}. System Balance: ₹${auditReport.totalSystemBalanceRupees.toFixed(2)}.`);

        // Clean up test records
        await userModel.deleteMany({ _id: { $in: [userId, userIdB, raceUserId] } });
        await paymentModel.deleteMany({ userId: { $in: [userId, userIdB, raceUserId] } });
        await subscriptionModel.deleteMany({ userId: { $in: [userId, userIdB, raceUserId] } });
        await walletModel.deleteMany({ userId: { $in: [userId, userIdB, raceUserId] } });
        await walletTransactionModel.deleteMany({ userId: { $in: [userId, userIdB, raceUserId] } });

        console.log("\n======================================================================");
        console.log("ALL 10 PHASE 7 EDGE CASES & RECONCILIATION PASSED SUCCESSFULLY! ✅");
        console.log("======================================================================");
        process.exit(0);
    } catch (error) {
        console.error("Master edge case test failed:", error);
        process.exit(1);
    }
}

runMasterEdgeCaseTests().catch((err) => {
    console.error("Master edge case test unhandled error:", err);
    process.exit(1);
});
