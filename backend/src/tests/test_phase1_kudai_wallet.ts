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

import { userModel } from "../infrastructure/database/model/UserModel.js";
import { walletModel } from "../infrastructure/database/model/WalletModel.js";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel.js";
import { planModel } from "../infrastructure/database/model/PlanModel.js";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel.js";
import { paymentModel } from "../infrastructure/database/model/PaymentModel.js";

async function runPhase1Test() {
    console.log("==========================================================");
    console.log("=== PHASE 1 TEST: MODELS & WALLET SERVICE (KUDAI) ===");
    console.log("==========================================================");

    await connectMongo();
    console.log("✓ Connected to MongoDB Atlas\n");

    const userRepo = new MongoUserRepository();
    const walletRepo = new MongoWalletRepository();
    const walletTxRepo = new MongoWalletTransactionRepository();
    const planRepo = new MongoPlanRepository();
    const subRepo = new MongoSubscriptionRepository();
    const paymentRepo = new MongoPaymentRepository();
    const walletService = new WalletService(walletRepo, walletTxRepo);

    // 1. Create a Test User starting as "seeker"
    const testEmail = `phase1_test_${Date.now()}@example.com`;
    const userDoc = await userModel.create({
        email: testEmail,
        firstName: "CleanArch",
        lastName: "Tester",
        hashedPassword: "HashPassword@123",
        role: "seeker",
        isVerified: true,
        isBlocked: false,
    });
    const userId = userDoc._id.toString();
    console.log(`[1] Created Test User: ${userId} with initial role: "seeker"`);

    try {
        // 2. Rule 1: Wallet is per USER and initialized to 0
        const initialWallet = await walletService.getWallet(userId);
        if (initialWallet.balance !== 0 || initialWallet.userId !== userId) {
            throw new Error(`Wallet initialization failed: ${JSON.stringify(initialWallet)}`);
        }
        console.log(`✓ [2] User wallet initialized: balance = ${initialWallet.balance} paise, version = ${initialWallet.version}`);

        // 3. Atomic Credit: Add ₹500 (50,000 paise)
        const creditResult = await walletService.credit({
            userId,
            amount: 50000,
            reason: "topup",
            description: "Wallet test top-up",
        });
        if (creditResult.wallet.balance !== 50000 || creditResult.transaction.type !== "credit") {
            throw new Error(`Credit failed: ${JSON.stringify(creditResult)}`);
        }
        console.log(`✓ [3] Atomic credit: New Balance = ₹${creditResult.wallet.balance / 100}, Ledger Row = [${creditResult.transaction.type}] ${creditResult.transaction.reason}`);

        // 4. Role switch: User switches from seeker -> host
        await userRepo.updateUser(userId, { role: "host" });
        const walletAfterRoleSwitch = await walletService.getWallet(userId);
        if (walletAfterRoleSwitch.balance !== 50000) {
            throw new Error("Wallet balance was lost or mutated on role switch!");
        }
        console.log(`✓ [4] Rule 1 Verified: Wallet survived role switch to 'host' (Balance unchanged: ₹${walletAfterRoleSwitch.balance / 100})`);

        // 5. Atomic Debit: Purchase premium plan ₹299 (29,900 paise)
        const debitResult = await walletService.debit({
            userId,
            amount: 29900,
            reason: "premium_purchase",
            description: "Monthly Host Premium purchase",
        });
        if (debitResult.wallet.balance !== 20100 || debitResult.transaction.type !== "debit") {
            throw new Error(`Debit failed: ${JSON.stringify(debitResult)}`);
        }
        console.log(`✓ [5] Atomic debit: New Balance = ₹${debitResult.wallet.balance / 100}, Ledger Row = [${debitResult.transaction.type}] ${debitResult.transaction.reason}`);

        // 6. Prevent Negative Balance: Attempt to debit ₹300 (30,000 paise) when only ₹201 is available
        let rejectedAsExpected = false;
        try {
            await walletService.debit({
                userId,
                amount: 30000,
                reason: "premium_purchase",
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("Insufficient wallet balance")) {
                rejectedAsExpected = true;
                console.log(`✓ [6] Insufficient balance check caught correctly: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!rejectedAsExpected) {
            throw new Error("Negative balance was unexpectedly permitted!");
        }

        // 7. Verify Ledger Credit for Refund: 'premium_refund'
        const refundResult = await walletService.credit({
            userId,
            amount: 29900,
            reason: "premium_refund",
            description: "Full refund within 3-day window",
        });
        if (refundResult.transaction.reason !== "premium_refund" || refundResult.wallet.balance !== 50000) {
            throw new Error("premium_refund transaction reason failed");
        }
        console.log(`✓ [7] Rule 7 Ledger reason verified: [${refundResult.transaction.reason}] Balance restored to ₹${refundResult.wallet.balance / 100}`);

        // 8. Reconcile: Balance must equal Credits - Debits
        const { isBalanced, walletBalance, ledgerBalance } = await walletService.reconcile(userId);
        if (!isBalanced || walletBalance !== 50000 || ledgerBalance !== 50000) {
            throw new Error(`Reconciliation failure: wallet=${walletBalance}, ledger=${ledgerBalance}`);
        }
        console.log(`✓ [8] Ledger reconciliation check passed: Wallet Balance (${walletBalance}) == Sum of Ledger Rows (${ledgerBalance})`);

        // 9. Verify New Model Schemas (Plan audience, Subscription benefitsUsedAt/purchasedAt, Payment purpose)
        const plan = await planRepo.create({
            name: `Host Plan ${Date.now()}`,
            price: 49900,
            durationDays: 30,
            audience: "host",
            isActive: true,
        });
        if (plan.audience !== "host") throw new Error("Plan audience 'host' not set");

        const payment = await paymentRepo.create({
            razorpayOrderId: `order_test_${Date.now()}`,
            amount: 49900,
            status: "created",
            purpose: "premium",
            userId,
        });
        if (payment.purpose !== "premium") throw new Error("Payment purpose 'premium' not set");

        const sub = await subRepo.create({
            userId,
            planId: plan.id,
            status: "active",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            purchasedAt: new Date(),
            benefitsUsedAt: null,
            paymentId: payment.id,
        });
        if (sub.benefitsUsedAt !== null || !sub.purchasedAt) {
            throw new Error("Subscription purchasedAt or benefitsUsedAt not correctly persisted");
        }
        console.log(`✓ [9] Models validated: Plan(audience: "host"), Payment(purpose: "premium"), Subscription(benefitsUsedAt: null, purchasedAt: Date)`);

        console.log("\n==========================================================");
        console.log("🎉 ALL PHASE 1 CHECKS PASSED PERFECTLY!");
        console.log("==========================================================");
    } finally {
        // Cleanup test data
        await userModel.findByIdAndDelete(userId);
        await walletModel.deleteOne({ userId });
        await walletTransactionModel.deleteMany({ userId });
        await planModel.deleteMany({ name: /Host Plan/ });
        await subscriptionModel.deleteMany({ userId });
        await paymentModel.deleteMany({ userId });
        await mongoose.disconnect();
    }
}

runPhase1Test().catch((err) => {
    console.error("Phase 1 test failed:", err);
    process.exit(1);
});
