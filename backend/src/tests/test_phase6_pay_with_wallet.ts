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

import { ActivateSubscriptionUseCase } from "../application/use-case/subscription/ActivateSubscriptionUseCase.js";

import { userModel } from "../infrastructure/database/model/UserModel.js";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel.js";
import { walletModel } from "../infrastructure/database/model/WalletModel.js";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel.js";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans.js";

async function runPhase6Tests() {
    console.log("==========================================================");
    console.log("=== PHASE 6 TEST: PAY WITH WALLET FOR PREMIUM (KUDAI) ===");
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

    const activateSubUseCase = new ActivateSubscriptionUseCase(
        paymentRepo,
        planRepo,
        subRepo,
        userRepo,
        walletService
    );

    // Host Monthly Plan (49900 paise, ₹499)
    const plans = await planRepo.findAllActive("host");
    const monthlyPlan = plans.find((p) => p.durationDays === 30)!;

    // 1. Setup Seeker User with funds
    const seeker = await userModel.create({
        email: `phase6_seeker_${Date.now()}@example.com`,
        firstName: "Rich",
        lastName: "Seeker",
        hashedPassword: "Password@123",
        role: "seeker",
        isVerified: true,
        isBlocked: false,
    });
    const seekerId = seeker._id.toString();

    // Top up seeker wallet with ₹1,000
    await walletService.credit({
        userId: seekerId,
        amount: 100000,
        reason: "topup",
    });
    console.log(`[Setup] Created seeker ${seekerId} with ₹1,000 wallet balance`);

    try {
        // -----------------------------------------------------------------
        // TEST 1: Rule 2 - Seeker cannot pay with wallet for host premium
        // -----------------------------------------------------------------
        console.log("\n--- TEST 1: Reject Seeker from Paying with Wallet (Rule 2) ---");
        let seekerRejected = false;
        try {
            await activateSubUseCase.activateFromWallet({
                userId: seekerId,
                planId: monthlyPlan.id,
            });
        } catch (err: unknown) {
            const msg = (err as Error).message;
            if (msg.includes("Only users currently in the host role can activate premium membership")) {
                seekerRejected = true;
                console.log(`✓ Caught expected role rejection: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!seekerRejected) throw new Error("Seeker was allowed to pay with wallet for premium!");

        const seekerWallet = await walletService.getWallet(seekerId);
        if (seekerWallet.balance !== 100000) {
            throw new Error(`Seeker wallet balance was deducted! Balance: ${seekerWallet.balance}`);
        }
        console.log(`✓ Seeker wallet balance untouched: ₹${seekerWallet.balance / 100}`);
        console.log("✓ TEST 1 PASSED: Rule 2 non-host rejection verified.");

        // -----------------------------------------------------------------
        // TEST 2: Switch to Host, Insufficient Balance Check
        // -----------------------------------------------------------------
        console.log("\n--- TEST 2: Insufficient Wallet Balance Check ---");
        const host = await userModel.create({
            email: `phase6_host_${Date.now()}@example.com`,
            firstName: "Budget",
            lastName: "Host",
            hashedPassword: "Password@123",
            role: "host",
            isVerified: true,
            isBlocked: false,
        });
        const hostId = host._id.toString();

        // Host only has ₹100 (10000 paise)
        await walletService.credit({
            userId: hostId,
            amount: 10000,
            reason: "topup",
        });
        console.log(`[Setup] Created host ${hostId} with ₹100 wallet balance`);

        let insufficientCaught = false;
        try {
            await activateSubUseCase.activateFromWallet({
                userId: hostId,
                planId: monthlyPlan.id,
            });
        } catch (err: unknown) {
            const msg = (err as Error).message;
            if (msg.includes("Insufficient wallet balance")) {
                insufficientCaught = true;
                console.log(`✓ Caught insufficient balance error: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!insufficientCaught) throw new Error("Purchase with insufficient balance was allowed!");

        const hostWalletAfterFail = await walletService.getWallet(hostId);
        if (hostWalletAfterFail.balance !== 10000) {
            throw new Error(`Host balance mutated on failure! Balance: ${hostWalletAfterFail.balance}`);
        }
        console.log(`✓ Balance preserved untouched: ₹${hostWalletAfterFail.balance / 100}`);
        console.log("✓ TEST 2 PASSED: Insufficient balance rollback verified.");

        // -----------------------------------------------------------------
        // TEST 3: Successful Pay-with-Wallet Purchase
        // -----------------------------------------------------------------
        console.log("\n--- TEST 3: Successful Pay-with-Wallet Purchase ---");
        // Add ₹500 more (total ₹600 = 60,000 paise)
        await walletService.credit({
            userId: hostId,
            amount: 50000,
            reason: "topup",
        });

        const sub = await activateSubUseCase.activateFromWallet({
            userId: hostId,
            planId: monthlyPlan.id,
        });

        if (sub.status !== "active") throw new Error("Subscription status not active");
        if (sub.benefitsUsedAt !== null) throw new Error("Subscription benefitsUsedAt must be null");
        if (!sub.purchasedAt) throw new Error("Subscription purchasedAt must be set");

        console.log(`✓ Subscription activated from wallet: ID = ${sub.id}`);
        console.log(`  PurchasedAt: ${sub.purchasedAt.toISOString()}`);
        console.log(`  BenefitsUsedAt: ${sub.benefitsUsedAt}`);
        console.log(`  ExpiresAt: ${sub.endDate?.toISOString()}`);

        // Check wallet debited: 60,000 - 49,900 = 10,100 paise (₹101)
        const hostWalletAfter = await walletService.getWallet(hostId);
        const expectedBalance = 60000 - 49900;
        if (hostWalletAfter.balance !== expectedBalance) {
            throw new Error(`Expected balance ${expectedBalance}, got: ${hostWalletAfter.balance}`);
        }
        console.log(`✓ Wallet successfully debited: New Balance = ₹${hostWalletAfter.balance / 100}`);

        // Verify ledger entry
        const { transactions: hostTxs } = await walletTxRepo.findByUserId(hostId);
        const purchaseTx = hostTxs.find((tx) => tx.reason === "premium_purchase");
        if (!purchaseTx || purchaseTx.type !== "debit" || purchaseTx.amount !== 49900) {
            throw new Error("Missing or invalid 'premium_purchase' debit entry");
        }
        console.log(`✓ Ledger debit row confirmed: [${purchaseTx.type}] ${purchaseTx.reason} (-₹${purchaseTx.amount / 100})`);

        // Verify user marked isPremium
        const updatedHost = await userRepo.findById(hostId);
        if (!updatedHost?.isPremium || !updatedHost.premiumExpiresAt) {
            throw new Error("User entity isPremium or premiumExpiresAt not set");
        }
        console.log(`✓ Host user updated: isPremium = true, expires = ${updatedHost.premiumExpiresAt.toLocaleDateString()}`);

        // Reconciliation
        const { isBalanced, walletBalance, ledgerBalance } = await walletService.reconcile(hostId);
        if (!isBalanced || walletBalance !== expectedBalance || ledgerBalance !== expectedBalance) {
            throw new Error(`Reconciliation failure: wallet=${walletBalance}, ledger=${ledgerBalance}`);
        }
        console.log(`✓ Ledger reconciliation passed: Balance (${walletBalance}) == Sum of Ledger Rows (${ledgerBalance})`);
        console.log("✓ TEST 3 PASSED: Pay-with-wallet purchase verified.");

        // -----------------------------------------------------------------
        // TEST 4: Rule 5 - Block second purchase while active
        // -----------------------------------------------------------------
        console.log("\n--- TEST 4: Block Second Purchase while Active (Rule 5) ---");
        let duplicateBlocked = false;
        try {
            await activateSubUseCase.activateFromWallet({
                userId: hostId,
                planId: monthlyPlan.id,
            });
        } catch (err: unknown) {
            const msg = (err as Error).message;
            if (msg.includes("already have an active premium membership")) {
                duplicateBlocked = true;
                console.log(`✓ Caught expected duplicate purchase block: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!duplicateBlocked) throw new Error("Host was allowed to purchase second active subscription!");
        console.log("✓ TEST 4 PASSED: Rule 5 duplicate purchase prevention verified.");

        // Cleanup host
        await userModel.findByIdAndDelete(hostId);
        await walletModel.deleteOne({ userId: hostId });
        await walletTransactionModel.deleteMany({ userId: hostId });
        await subscriptionModel.deleteMany({ userId: hostId });

        console.log("\n==========================================================");
        console.log("🎉 ALL PHASE 6 CHECKS PASSED PERFECTLY!");
        console.log("==========================================================");
    } finally {
        await userModel.findByIdAndDelete(seekerId);
        await walletModel.deleteOne({ userId: seekerId });
        await walletTransactionModel.deleteMany({ userId: seekerId });
        await mongoose.disconnect();
    }
}

runPhase6Tests().catch((err) => {
    console.error("Phase 6 test failed:", err);
    process.exit(1);
});
