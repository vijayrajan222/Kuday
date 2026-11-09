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
import { userModel } from "../infrastructure/database/model/UserModel";
import { paymentModel } from "../infrastructure/database/model/PaymentModel";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel";
import { walletModel } from "../infrastructure/database/model/WalletModel";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans";

async function runPhase3Tests() {
    console.log("=== PHASE 3: SUBSCRIPTION ACTIVATION IN ONE DB TRANSACTION ===");
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

    // Create a temporary test user
    const testUser = await userModel.create({
        email: `test_sub_${Date.now()}@example.com`,
        firstName: "Sub",
        lastName: "Tester",
        isVerified: true,
        isBlocked: false,
    });
    const userId = testUser._id.toString();

    try {
        const plans = await planRepo.findAllActive();
        const monthlyPlan = plans.find((p) => p.name === "Monthly Premium") || plans[0]!;

        // Test 1: Full Atomic Activation on Payment Verification
        console.log("\n[TEST 1] Atomic Subscription Activation (Payment + Subscription + Ledger + User)");
        const orderResult = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
            idempotencyKey: `sub_idemp_${Date.now()}`,
        });

        const testPaymentId = `pay_sub_${Date.now()}`;
        const secret = process.env.RAZORPAY_KEY_SECRET || "NXDoviT1t7tkuSFC4Pz6Hwx6";
        const signature = crypto
            .createHmac("sha256", secret)
            .update(`${orderResult.orderId}|${testPaymentId}`)
            .digest("hex");

        const verifyResult = await verifyPaymentUseCase.execute({
            userId,
            razorpayOrderId: orderResult.orderId,
            razorpayPaymentId: testPaymentId,
            razorpaySignature: signature,
        });

        console.assert(verifyResult.success === true, "Verification must succeed");
        console.assert(verifyResult.subscription !== undefined, "Subscription must be returned");
        const activeSub = verifyResult.subscription!;
        console.assert(activeSub.status === "active", `Expected status active, got ${activeSub.status}`);
        console.assert(activeSub.planId === monthlyPlan.id, "PlanId must match");
        console.log(`[PASS] Subscription created and active! ID: ${activeSub.id}, Valid until: ${activeSub.endDate?.toISOString()}`);

        // Verify Payment in DB
        const dbPayment = await paymentRepo.findByRazorpayOrderId(orderResult.orderId);
        console.assert(dbPayment!.status === "captured", `Payment must be captured, got ${dbPayment!.status}`);
        console.assert(dbPayment!.razorpayPaymentId === testPaymentId, "Payment ID must match");
        console.log(`[PASS] Payment state captured with razorpayPaymentId: ${dbPayment!.razorpayPaymentId}`);

        // Verify User Entity Updated in DB
        const dbUser = await userRepo.findById(userId);
        console.assert(dbUser!.isPremium === true, "User must have isPremium = true");
        console.assert(dbUser!.premiumExpiresAt !== undefined, "User must have premiumExpiresAt set");
        console.log(`[PASS] User entity isPremium: ${dbUser!.isPremium}, expires: ${dbUser!.premiumExpiresAt}`);

        // Verify Wallet Ledger Transactions in DB
        const ledgerRows = await walletTxRepo.findByUserId(userId, 10, 0);
        console.assert(ledgerRows.total === 2, `Expected 2 ledger transactions (topup + purchase), got ${ledgerRows.total}`);
        const topupTx = ledgerRows.transactions.find((t) => t.type === "credit" && t.reason === "topup");
        const purchaseTx = ledgerRows.transactions.find((t) => t.type === "debit" && t.reason === "premium_purchase");

        console.assert(topupTx !== undefined, "Topup ledger entry must exist");
        console.assert(topupTx!.amount === monthlyPlan.price, `Topup amount must be ${monthlyPlan.price}`);
        console.assert(purchaseTx !== undefined, "Premium purchase ledger entry must exist");
        console.assert(purchaseTx!.amount === monthlyPlan.price, `Purchase amount must be ${monthlyPlan.price}`);
        console.log(`[PASS] Ledger entries verified: 1) Credit ${topupTx!.amount} paise [topup], 2) Debit ${purchaseTx!.amount} paise [premium_purchase]`);

        // Verify Wallet Reconciliation: sum(ledger) === wallet.balance
        const recon = await walletService.reconcile(userId);
        console.assert(recon.isBalanced === true, "Wallet and Ledger must balance");
        console.assert(recon.walletBalance === 0, `Expected wallet balance 0, got ${recon.walletBalance}`);
        console.log(`[PASS] Reconciled: Wallet balance = ${recon.walletBalance} paise, Ledger sum = ${recon.ledgerBalance} paise`);

        // Test 2: Idempotency (verify + webhook both firing -> activate only once)
        console.log("\n[TEST 2] Idempotency: Webhook / Re-verify firing for the same payment");
        const duplicateActivation = await activateSubscriptionUseCase.activateFromPayment({
            userId,
            razorpayOrderId: orderResult.orderId,
            razorpayPaymentId: testPaymentId,
        });

        console.assert(duplicateActivation.id === activeSub.id, "Must return existing subscription ID without creating duplicate");

        const subCount = await subscriptionModel.countDocuments({ userId, status: "active" });
        console.assert(subCount === 1, `Expected exactly 1 active subscription, found ${subCount}`);

        const ledgerCount = await walletTransactionModel.countDocuments({ userId });
        console.assert(ledgerCount === 2, `Expected exactly 2 ledger rows, found ${ledgerCount}`);
        console.log(`[PASS] Idempotency confirmed: No duplicate subscription or ledger entry created.`);

        // Test 3: Purchase via Wallet Balance directly
        console.log("\n[TEST 3] Purchase via Wallet Balance");
        // Create another test user with wallet balance
        const walletUser = await userModel.create({
            email: `test_wallet_user_${Date.now()}@example.com`,
            firstName: "Wallet",
            lastName: "Buyer",
            isVerified: true,
            isBlocked: false,
        });
        const walletUserId = walletUser._id.toString();

        // Topup wallet with ₹1500 (150000 paise)
        await walletService.credit({
            userId: walletUserId,
            amount: 150000,
            reason: "topup",
            description: "Test wallet balance pre-load",
        });

        // Activate Quarterly plan (₹1199 = 119900 paise) directly from wallet
        const quarterlyPlan = plans.find((p) => p.name === "Quarterly Premium") || plans[1]!;
        const walletSub = await activateSubscriptionUseCase.activateFromWallet({
            userId: walletUserId,
            planId: quarterlyPlan.id,
        });

        console.assert(walletSub.status === "active", "Wallet sub must be active");
        const remainingWallet = await walletService.getWallet(walletUserId);
        const expectedRemaining = 150000 - quarterlyPlan.price;
        console.assert(remainingWallet.balance === expectedRemaining, `Expected balance ${expectedRemaining}, got ${remainingWallet.balance}`);
        console.log(`[PASS] Purchased from wallet. Remaining balance: ${remainingWallet.balance} paise (₹${remainingWallet.balance / 100})`);

        const walletRecon = await walletService.reconcile(walletUserId);
        console.assert(walletRecon.isBalanced === true, "Wallet user must be balanced");
        console.log(`[PASS] Wallet user reconciled: Balance = ${walletRecon.walletBalance} paise, Ledger = ${walletRecon.ledgerBalance} paise`);

        // Clean up second user
        await userModel.deleteMany({ _id: walletUserId });
        await subscriptionModel.deleteMany({ userId: walletUserId });
        await walletModel.deleteMany({ userId: walletUserId });
        await walletTransactionModel.deleteMany({ userId: walletUserId });

        console.log("\n==========================================");
        console.log("ALL PHASE 3 TESTS PASSED SUCCESSFULLY! ✅");
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

runPhase3Tests().catch((err) => {
    console.error("Phase 3 test failed with error:", err);
    process.exit(1);
});
