import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
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
import { PremiumHookService } from "../application/services/PremiumHookService.js";

import { CreateOrderUseCase } from "../application/use-case/payment/CreateOrderUseCase.js";
import { VerifyPaymentUseCase } from "../application/use-case/payment/VerifyPaymentUseCase.js";
import { HandleWebhookUseCase } from "../application/use-case/payment/HandleWebhookUseCase.js";
import { ActivateSubscriptionUseCase } from "../application/use-case/subscription/ActivateSubscriptionUseCase.js";
import { RequestRefundUseCase } from "../application/use-case/subscription/CancelSubscriptionUseCase.js";

import { userModel } from "../infrastructure/database/model/UserModel.js";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel.js";
import { walletModel } from "../infrastructure/database/model/WalletModel.js";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel.js";
import { paymentModel } from "../infrastructure/database/model/PaymentModel.js";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans.js";
import { runReconciliationAudit } from "../scripts/reconcile_wallets.js";

async function runMasterEdgeCaseSuite() {
    console.log("================================================================================");
    console.log("=== PHASE 9 MASTER EDGE CASES & SYSTEM RECONCILIATION SUITE (KUDAI) ===");
    console.log("================================================================================");

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
    const hookService = new PremiumHookService(userRepo, subRepo);

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

    const requestRefundUseCase = new RequestRefundUseCase(
        subRepo,
        planRepo,
        paymentRepo,
        userRepo,
        walletService
    );

    // Get Monthly Plan
    const plans = await planRepo.findAllActive("host");
    const monthlyPlan = plans.find((p) => p.durationDays === 30);
    if (!monthlyPlan) {
        throw new Error("Monthly host plan not found.");
    }
    const planId = monthlyPlan.id;
    const planPrice = monthlyPlan.price;

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || "mock_secret";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "mock_webhook_secret";

    // -------------------------------------------------------------------------
    // TEST 1: Non-host role tries to buy premium (Rule 2)
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Non-Host tries to buy premium (Rule 2) ---");
    const seekerUser = await userModel.create({
        firstName: "Seeker",
        lastName: "Tester",
        email: `seeker_${Date.now()}@example.com`,
        hashedPassword: "HashPassword@123",
        role: "seeker",
    });

    let nonHostBlocked = false;
    try {
        await createOrderUseCase.execute({
            userId: seekerUser._id.toString(),
            planId,
        });
    } catch (err: any) {
        if (err.message.toLowerCase().includes("host role")) {
            nonHostBlocked = true;
            console.log(`✓ Non-host blocked as expected: "${err.message}"`);
        } else {
            throw err;
        }
    }
    if (!nonHostBlocked) throw new Error("TEST 1 FAILED: Non-host was permitted to create order!");
    console.log("✓ TEST 1 PASSED: Rule 2 server-side role enforcement verified.\n");

    // -------------------------------------------------------------------------
    // TEST 2: Host with active premium tries to buy again (Rule 5)
    // -------------------------------------------------------------------------
    console.log("--- TEST 2: Host already premium tries to buy again (Rule 5) ---");
    const hostUser = await userModel.create({
        firstName: "Host",
        lastName: "Alpha",
        email: `host_alpha_${Date.now()}@example.com`,
        hashedPassword: "HashPassword@123",
        role: "host",
    });
    const hostId = hostUser._id.toString();

    // Create active subscription for host
    await subscriptionModel.create({
        userId: hostId,
        planId,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        purchasedAt: new Date(),
        benefitsUsedAt: null,
    });

    let duplicateBlocked = false;
    try {
        await createOrderUseCase.execute({
            userId: hostId,
            planId,
        });
    } catch (err: any) {
        if (err.message.toLowerCase().includes("active premium")) {
            duplicateBlocked = true;
            console.log(`✓ Duplicate purchase blocked as expected: "${err.message}"`);
        } else {
            throw err;
        }
    }
    if (!duplicateBlocked) throw new Error("TEST 2 FAILED: Duplicate active purchase permitted!");
    console.log("✓ TEST 2 PASSED: Rule 5 active subscription duplication prevented.\n");

    // -------------------------------------------------------------------------
    // TEST 3: Tampered signature on verify
    // -------------------------------------------------------------------------
    console.log("--- TEST 3: Tampered HMAC SHA-256 signature rejection ---");
    const testHost2 = await userModel.create({
        firstName: "Host",
        lastName: "Bravo",
        email: `host_bravo_${Date.now()}@example.com`,
        hashedPassword: "HashPassword@123",
        role: "host",
    });
    const host2Id = testHost2._id.toString();

    const orderRes = await createOrderUseCase.execute({
        userId: host2Id,
        planId,
    });

    let tamperedBlocked = false;
    try {
        await verifyPaymentUseCase.execute({
            userId: host2Id,
            razorpayOrderId: orderRes.orderId,
            razorpayPaymentId: `pay_${Date.now()}`,
            razorpaySignature: "invalid_tampered_signature_hex_12345",
        });
    } catch (err: any) {
        if (err.message.includes("signature verification failed") || err.message.includes("Invalid")) {
            tamperedBlocked = true;
            console.log(`✓ Tampered signature rejected: "${err.message}"`);
        } else {
            throw err;
        }
    }
    if (!tamperedBlocked) throw new Error("TEST 3 FAILED: Tampered signature was accepted!");
    console.log("✓ TEST 3 PASSED: Cryptographic signature tampering defense verified.\n");

    // -------------------------------------------------------------------------
    // TEST 4: Verify + Webhook race condition (idempotency, single activation)
    // -------------------------------------------------------------------------
    console.log("--- TEST 4: Verify + Webhook race condition / duplicate firing ---");
    const testHost3 = await userModel.create({
        firstName: "Host",
        lastName: "Charlie",
        email: `host_charlie_${Date.now()}@example.com`,
        hashedPassword: "HashPassword@123",
        role: "host",
    });
    const host3Id = testHost3._id.toString();

    const order3 = await createOrderUseCase.execute({
        userId: host3Id,
        planId,
    });

    const paymentId3 = `pay_race_${Date.now()}`;
    const validSig = crypto
        .createHmac("sha256", razorpaySecret)
        .update(`${order3.orderId}|${paymentId3}`)
        .digest("hex");

    // 1. Verify completes first
    const verifyRes = await verifyPaymentUseCase.execute({
        userId: host3Id,
        razorpayOrderId: order3.orderId,
        razorpayPaymentId: paymentId3,
        razorpaySignature: validSig,
    });
    console.log(`✓ Verify activated sub: ${verifyRes.subscription?.id}`);

    // 2. Webhook arrives shortly after with captured event for same order
    const webhookEvent3 = {
        event: "payment.captured",
        payload: {
            payment: {
                entity: {
                    id: paymentId3,
                    order_id: order3.orderId,
                    amount: planPrice,
                    currency: "INR",
                    status: "captured",
                    notes: {
                        userId: host3Id,
                        planId,
                        purpose: "premium",
                    },
                },
            },
        },
    };
    const webhookPayload = JSON.stringify(webhookEvent3);
    const webhookSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
        .update(webhookPayload)
        .digest("hex");

    const webhookRes = await handleWebhookUseCase.execute({
        rawBody: webhookPayload,
        signature: webhookSig,
        eventPayload: webhookEvent3,
    });
    console.log(`✓ Webhook handled idempotent duplicate safely (action: ${webhookRes.action})`);

    // Ensure user has exactly 1 subscription, not 2
    const totalSubs = await subscriptionModel.countDocuments({ userId: host3Id });
    if (totalSubs !== 1) {
        throw new Error(`TEST 4 FAILED: Expected exactly 1 subscription, found ${totalSubs}`);
    }
    console.log("✓ TEST 4 PASSED: Verify + Webhook race condition successfully resolved idempotently.\n");

    // -------------------------------------------------------------------------
    // TEST 5: User closes checkout midway & Webhook rescues dropped connection
    // -------------------------------------------------------------------------
    console.log("--- TEST 5: User closes checkout midway & Webhook rescues dropped connection ---");
    const testHost4 = await userModel.create({
        firstName: "Host",
        lastName: "Delta",
        email: `host_delta_${Date.now()}@example.com`,
        hashedPassword: "HashPassword@123",
        role: "host",
    });
    const host4Id = testHost4._id.toString();

    const order4 = await createOrderUseCase.execute({
        userId: host4Id,
        planId,
    });

    const paymentId4 = `pay_rescued_${Date.now()}`;
    const rescueEvent = {
        event: "payment.captured",
        payload: {
            payment: {
                entity: {
                    id: paymentId4,
                    order_id: order4.orderId,
                    amount: planPrice,
                    status: "captured",
                    method: "upi",
                    notes: {
                        userId: host4Id,
                        planId,
                        purpose: "premium",
                    },
                },
            },
        },
    };
    const rescuePayload = JSON.stringify(rescueEvent);
    const rescueSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
        .update(rescuePayload)
        .digest("hex");

    await handleWebhookUseCase.execute({
        rawBody: rescuePayload,
        signature: rescueSig,
        eventPayload: rescueEvent,
    });

    const rescuedSub = await subscriptionModel.findOne({ userId: host4Id, status: "active" });
    if (!rescuedSub) {
        throw new Error("TEST 5 FAILED: Webhook failed to rescue orphaned checkout!");
    }
    console.log(`✓ Orphaned checkout rescued by webhook: Sub ${rescuedSub._id} is active`);
    console.log("✓ TEST 5 PASSED: Webhook safety net rescued abandoned user connection.\n");

    // -------------------------------------------------------------------------
    // TEST 6: Concurrent wallet debits & insufficient balance
    // -------------------------------------------------------------------------
    console.log("--- TEST 6: Concurrent wallet debits & insufficient balance defense ---");
    const testHost5 = await userModel.create({
        firstName: "Host",
        lastName: "Echo",
        email: `host_echo_${Date.now()}@example.com`,
        hashedPassword: "HashPassword@123",
        role: "host",
    });
    const host5Id = testHost5._id.toString();

    // Create wallet with exactly enough balance for 1 purchase (₹499)
    await walletModel.create({
        userId: host5Id,
        balance: planPrice,
        version: 0,
    });
    await walletTransactionModel.create({
        userId: host5Id,
        type: "credit",
        amount: planPrice,
        balanceAfter: planPrice,
        reason: "topup",
        referenceId: "initial_topup",
    });

    // Fire 2 simultaneous wallet purchase attempts
    const results = await Promise.allSettled([
        activateSubUseCase.activateFromWallet({ userId: host5Id, planId }),
        activateSubUseCase.activateFromWallet({ userId: host5Id, planId }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    console.log(`Concurrent wallet debit results: ${fulfilled.length} fulfilled, ${rejected.length} rejected`);
    if (fulfilled.length !== 1 || rejected.length !== 1) {
        throw new Error(`TEST 6 FAILED: Expected exactly 1 success and 1 rejection, got ${fulfilled.length} / ${rejected.length}`);
    }

    const finalWallet = await walletModel.findOne({ userId: host5Id });
    if (finalWallet!.balance < 0) {
        throw new Error(`TEST 6 FAILED: Wallet balance went negative: ${finalWallet!.balance}`);
    }
    console.log(`✓ Wallet balance after concurrent debit: ₹${finalWallet!.balance / 100} (never negative)`);
    console.log("✓ TEST 6 PASSED: Concurrency & balance control safely handled duplicate clicks.\n");

    // -------------------------------------------------------------------------
    // TEST 7: Refund Edge Cases (Window, Benefits Used, Double Refund)
    // -------------------------------------------------------------------------
    console.log("--- TEST 7: Refund Edge Cases (Window, Benefits Used, Double Refund) ---");
    const testHost6 = await userModel.create({
        firstName: "Host",
        lastName: "Foxtrot",
        email: `host_foxtrot_${Date.now()}@example.com`,
        hashedPassword: "HashPassword@123",
        role: "host",
    });
    const host6Id = testHost6._id.toString();

    // Setup wallet & sub
    await walletModel.create({ userId: host6Id, balance: 100000, version: 0 });
    await walletTransactionModel.create({
        userId: host6Id,
        type: "credit",
        amount: 100000,
        balanceAfter: 100000,
        reason: "topup",
    });

    const activeSub7 = await activateSubUseCase.activateFromWallet({ userId: host6Id, planId });

    // 7A: Refund rejection when benefits used
    await hookService.markPremiumBenefitsUsed(host6Id);
    let benefitsBlocked = false;
    try {
        await requestRefundUseCase.execute({
            userId: host6Id,
            subscriptionId: activeSub7.id,
        });
    } catch (err: any) {
        if (err.message.includes("benefits have already been used")) {
            benefitsBlocked = true;
            console.log(`✓ Blocked refund after benefits used: "${err.message}"`);
        }
    }
    if (!benefitsBlocked) throw new Error("TEST 7A FAILED: Refund permitted after benefits used!");

    // Reset benefitsUsedAt for window check
    await subscriptionModel.findByIdAndUpdate(activeSub7.id, {
        benefitsUsedAt: null,
        purchasedAt: new Date(Date.now() - 4 * 86400000), // 4 days ago (> 3 days)
    });

    // 7B: Refund rejection after 3-day window
    let windowBlocked = false;
    try {
        await requestRefundUseCase.execute({
            userId: host6Id,
            subscriptionId: activeSub7.id,
        });
    } catch (err: any) {
        if (err.message.includes("Refund window has expired")) {
            windowBlocked = true;
            console.log(`✓ Blocked refund after 3 days: "${err.message}"`);
        }
    }
    if (!windowBlocked) throw new Error("TEST 7B FAILED: Refund permitted after 3-day window!");

    // Reset purchasedAt to now for legitimate refund
    await subscriptionModel.findByIdAndUpdate(activeSub7.id, {
        purchasedAt: new Date(),
    });

    // 7C: Legitimate refund
    const refundResult = await requestRefundUseCase.execute({
        userId: host6Id,
        subscriptionId: activeSub7.id,
    });
    console.log(`✓ Legitimate refund processed: ₹${refundResult.refundAmount / 100} credited to wallet`);

    // 7D: Double refund rejection
    let doubleRefundBlocked = false;
    try {
        await requestRefundUseCase.execute({
            userId: host6Id,
            subscriptionId: activeSub7.id,
        });
    } catch (err: any) {
        if (err.message.includes("already been refunded")) {
            doubleRefundBlocked = true;
            console.log(`✓ Double refund blocked: "${err.message}"`);
        }
    }
    if (!doubleRefundBlocked) throw new Error("TEST 7D FAILED: Double refund was permitted!");
    console.log("✓ TEST 7 PASSED: All refund boundary conditions strictly enforced.\n");

    // -------------------------------------------------------------------------
    // TEST 8: Role switch while subscribed & hook gating (Rule 8 & 9)
    // -------------------------------------------------------------------------
    console.log("--- TEST 8: Role switch while subscribed (Rule 8 & 9) ---");
    const testHost7 = await userModel.create({
        firstName: "Host",
        lastName: "Golf",
        email: `host_golf_${Date.now()}@example.com`,
        hashedPassword: "HashPassword@123",
        role: "host",
    });
    const host7Id = testHost7._id.toString();
    await walletModel.create({ userId: host7Id, balance: 100000, version: 0 });
    await walletTransactionModel.create({
        userId: host7Id,
        type: "credit",
        amount: 100000,
        balanceAfter: 100000,
        reason: "topup",
    });
    await activateSubUseCase.activateFromWallet({ userId: host7Id, planId });

    // Initial check: active host
    const isPremiumBefore = await hookService.isHostPremium(host7Id);
    if (!isPremiumBefore) throw new Error("Expected isHostPremium true before switch");
    console.log("✓ Active host premium: isHostPremium = true");

    // Switch role to seeker
    await userModel.findByIdAndUpdate(host7Id, { role: "seeker" });
    const isPremiumWhileSeeker = await hookService.isHostPremium(host7Id);
    if (isPremiumWhileSeeker) throw new Error("Expected isHostPremium false while in seeker role");
    console.log("✓ Switched to seeker: isHostPremium = false (dormant, subscription preserved)");

    // Switch back to host
    await userModel.findByIdAndUpdate(host7Id, { role: "host" });
    const isPremiumRestored = await hookService.isHostPremium(host7Id);
    if (!isPremiumRestored) throw new Error("Expected isHostPremium true after restoring host role");
    console.log("✓ Switched back to host: isHostPremium = true (fully restored)");
    console.log("✓ TEST 8 PASSED: Role switch dormancy and restoration verified.\n");

    // -------------------------------------------------------------------------
    // TEST 9: System-wide Ledger Reconciliation Audit
    // -------------------------------------------------------------------------
    console.log("--- TEST 9: System-wide Ledger Reconciliation Audit ---");
    const auditReport = await runReconciliationAudit();
    console.log(`Audited ${auditReport.totalWalletsAudited} wallets across the entire database.`);
    console.log(`Balanced: ${auditReport.balancedCount} | Discrepancies: ${auditReport.discrepancyCount}`);
    console.log(`Total System Money: ₹${auditReport.totalSystemBalanceRupees.toFixed(2)} (${auditReport.totalSystemBalancePaise} paise)`);

    if (auditReport.discrepancyCount > 0) {
        console.error("❌ Discrepancies found:", auditReport.discrepancies);
        throw new Error("TEST 9 FAILED: Wallet ledger mismatch detected!");
    }
    console.log("✓ TEST 9 PASSED: Every single wallet mathematically matches ledger sum (credits - debits).");

    console.log("\n================================================================================");
    console.log("🎉 ALL PHASE 9 MASTER EDGE CASES & SYSTEM RECONCILIATION CHECKS PASSED!");
    console.log("================================================================================");
}

runMasterEdgeCaseSuite()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error("Master edge case test failed:", err);
        process.exit(1);
    });
