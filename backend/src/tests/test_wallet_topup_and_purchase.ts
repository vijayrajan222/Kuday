import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { connectMongo } from "../infrastructure/database/ConnectMongoDB.js";

import { MongoUserRepository } from "../infrastructure/repository/MongoUserRepository.js";
import { MongoWalletRepository } from "../infrastructure/repository/MongoWalletRepository.js";
import { MongoWalletTransactionRepository } from "../infrastructure/repository/MongoWalletTransactionRepository.js";
import { MongoPlanRepository } from "../infrastructure/repository/MongoPlanRepository.js";
import { MongoSubscriptionRepository } from "../infrastructure/repository/MongoSubscriptionRepository.js";
import { MongoPaymentRepository } from "../infrastructure/repository/MongoPaymentRepository.js";

import { WalletService } from "../infrastructure/services/WalletService.js";
import { RazorpayService } from "../infrastructure/services/RazorpayService.js";

import { CreateTopUpOrderUseCase } from "../application/use-case/payment/CreateTopUpOrderUseCase.js";
import { VerifyPaymentUseCase } from "../application/use-case/payment/VerifyPaymentUseCase.js";
import { ActivateSubscriptionUseCase } from "../application/use-case/subscription/ActivateSubscriptionUseCase.js";

import { userModel } from "../infrastructure/database/model/UserModel.js";
import { walletModel } from "../infrastructure/database/model/WalletModel.js";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel.js";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel.js";
import { paymentModel } from "../infrastructure/database/model/PaymentModel.js";

async function run() {
    console.log("==========================================================");
    console.log("=== VERIFYING OPTION A (PAY WITH WALLET) & OPTION B (TOP-UP) ===");
    console.log("==========================================================");

    await connectMongo();
    console.log("✓ Connected to MongoDB Atlas\n");

    // Repos & Services
    const userRepo = new MongoUserRepository();
    const walletRepo = new MongoWalletRepository();
    const txRepo = new MongoWalletTransactionRepository();
    const planRepo = new MongoPlanRepository();
    const subRepo = new MongoSubscriptionRepository();
    const paymentRepo = new MongoPaymentRepository();

    const walletService = new WalletService(walletRepo, txRepo);
    const razorpayService = new RazorpayService();

    const activateSubUseCase = new ActivateSubscriptionUseCase(
        paymentRepo,
        planRepo,
        subRepo,
        userRepo,
        walletService
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

    // Setup Test User
    const testEmail = `test_wallet_user_${Date.now()}@example.com`;
    const userDoc = await userModel.create({
        email: testEmail,
        firstName: "Wallet",
        lastName: "Tester",
        hashedPassword: "Password@123",
        role: "seeker",
        isVerified: true,
        isBlocked: false,
        isPremium: false,
    });
    const userId = userDoc._id.toString();
    console.log(`[Setup] Created test user: ${userId} (${testEmail})`);

    // Ensure wallet is initialized with 0
    await walletService.getWallet(userId);

    // Seed a test plan (₹299 = 29900 paise, 30 days)
    const testPlan = await planRepo.create({
        name: `Test Plan ${Date.now()}`,
        price: 29900,
        durationDays: 30,
        isActive: true,
        features: ["Feature A", "Feature B"],
    });
    console.log(`[Setup] Created test plan: ${testPlan.name} for ₹${testPlan.price / 100}\n`);

    try {
        // -------------------------------------------------------------
        // TEST 1: Option B - Top Up Wallet with ₹500 (50,000 paise)
        // -------------------------------------------------------------
        console.log("--- TEST 1: Option B - Top Up Wallet via Razorpay Order ---");
        const topupOrder = await createTopUpOrderUseCase.execute({
            userId,
            amountPaise: 50000,
        });

        console.log(`1. Created Razorpay Top-Up Order: ${topupOrder.orderId} for ${topupOrder.amount} paise (₹${topupOrder.amount / 100})`);

        // Generate valid signature
        const paymentId = `pay_mock_topup_${Date.now()}`;
        const secret = process.env.RAZORPAY_KEY_SECRET || "NXDoviT1t7tkuSFC4Pz6Hwx6";
        const signature = crypto
            .createHmac("sha256", secret)
            .update(`${topupOrder.orderId}|${paymentId}`)
            .digest("hex");

        // Verify and capture payment
        const verifyResult = await verifyPaymentUseCase.execute({
            userId,
            razorpayOrderId: topupOrder.orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
        });

        if (!verifyResult.success || verifyResult.status !== "captured") {
            throw new Error(`Expected payment captured, got: ${verifyResult.status}`);
        }

        // Check wallet balance
        const walletAfterTopup = (await walletService.getWallet(userId)).balance;
        if (walletAfterTopup !== 50000) {
            throw new Error(`Expected wallet balance 50000 paise, got ${walletAfterTopup}`);
        }

        // Check ledger
        const { transactions: ledgerTxs } = await txRepo.findByUserId(userId);
        const firstTx = ledgerTxs[0];
        if (ledgerTxs.length !== 1 || !firstTx || firstTx.reason !== "topup" || firstTx.type !== "credit") {
            throw new Error(`Invalid ledger entry for top-up`);
        }
        console.log(`✓ TEST 1 PASSED: Wallet successfully topped up to ₹${walletAfterTopup / 100} with verified ledger entry.\n`);

        // -------------------------------------------------------------
        // TEST 2: Option A - Pay Subscription from Wallet Balance (₹299)
        // -------------------------------------------------------------
        console.log("--- TEST 2: Option A - Direct Subscription Purchase via Wallet Balance ---");
        const activatedSub = await activateSubUseCase.activateFromWallet({
            userId,
            planId: testPlan.id,
        });

        if (activatedSub.status !== "active") {
            throw new Error(`Expected active subscription, got: ${activatedSub.status}`);
        }

        // Check user is marked premium
        const updatedUser = await userRepo.findById(userId);
        if (!updatedUser?.isPremium) {
            throw new Error("User entity isPremium flag was not set to true");
        }

        // Check wallet balance: 50,000 - 29,900 = 20,100 paise (₹201)
        const walletAfterPurchase = (await walletService.getWallet(userId)).balance;
        const expectedBalance = 50000 - 29900;
        if (walletAfterPurchase !== expectedBalance) {
            throw new Error(`Expected wallet balance ${expectedBalance}, got ${walletAfterPurchase}`);
        }

        // Verify ledger entries
        const { transactions: allLedger } = await txRepo.findByUserId(userId);
        if (allLedger.length !== 2) {
            throw new Error(`Expected 2 ledger entries, found ${allLedger.length}`);
        }
        const purchaseTx = allLedger.find((tx) => tx.reason === "premium_purchase");
        if (!purchaseTx || purchaseTx.type !== "debit" || purchaseTx.amount !== 29900) {
            throw new Error("Missing or invalid premium_purchase debit ledger entry");
        }
        console.log(`✓ TEST 2 PASSED: Subscription activated directly from wallet. Balance: ₹${walletAfterPurchase / 100}.\n`);

        // -------------------------------------------------------------
        // TEST 3: Edge Case - Insufficient Wallet Balance
        // -------------------------------------------------------------
        console.log("--- TEST 3: Edge Case - Insufficient Wallet Balance Check ---");
        // Create an expensive plan (₹999 = 99900 paise)
        const expensivePlan = await planRepo.create({
            name: `VIP Plan ${Date.now()}`,
            price: 99900,
            durationDays: 365,
            isActive: true,
        });

        // First expire the current sub so it allows a new attempt
        await subscriptionModel.findByIdAndUpdate(activatedSub.id, { status: "expired" });

        let blocked = false;
        try {
            await activateSubUseCase.activateFromWallet({
                userId,
                planId: expensivePlan.id,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("Insufficient wallet balance")) {
                blocked = true;
                console.log(`Expected rejection caught: "${msg}"`);
            } else {
                throw err;
            }
        }

        if (!blocked) {
            throw new Error("Purchase with insufficient balance was unexpectedly allowed!");
        }

        const balanceUntouched = (await walletService.getWallet(userId)).balance;
        if (balanceUntouched !== 20100) {
            throw new Error(`Wallet balance was mutated on failure! Expected 20100, got ${balanceUntouched}`);
        }
        console.log(`✓ TEST 3 PASSED: Insufficient balance atomic rollback verified.\n`);

        console.log("==========================================================");
        console.log("🎉 ALL TESTS FOR OPTION A & B PASSED PERFECTLY!");
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

run().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
