import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectMongo } from "../infrastructure/database/ConnectMongoDB";
import { MongoWalletRepository } from "../infrastructure/repository/MongoWalletRepository";
import { MongoWalletTransactionRepository } from "../infrastructure/repository/MongoWalletTransactionRepository";
import { MongoPlanRepository } from "../infrastructure/repository/MongoPlanRepository";
import { WalletService } from "../infrastructure/services/WalletService";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans";
import { walletModel } from "../infrastructure/database/model/WalletModel";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel";

async function runPhase1Tests() {
    console.log("=== PHASE 1: WALLET & MODELS UNIT / INTEGRATION TEST ===");
    await connectMongo();
    await seedDefaultPlans();

    const walletRepo = new MongoWalletRepository();
    const walletTxRepo = new MongoWalletTransactionRepository();
    const planRepo = new MongoPlanRepository();
    const walletService = new WalletService(walletRepo, walletTxRepo);

    // Verify plans seeded
    const activePlans = await planRepo.findAllActive();
    console.log(`[PASS] Seeded active plans count: ${activePlans.length}`);
    activePlans.forEach((p) => {
        console.log(`   - Plan: ${p.name} | Price: ₹${p.price / 100} (${p.price} paise) | Days: ${p.durationDays}`);
        if (!Number.isInteger(p.price) || p.price <= 0) {
            throw new Error(`Plan price ${p.price} is not a valid integer paise`);
        }
    });

    const testUserId = new mongoose.Types.ObjectId().toString();

    // Clean up test data if any
    await walletModel.deleteMany({ userId: testUserId });
    await walletTransactionModel.deleteMany({ userId: testUserId });

    // Test 1: Get or Create Wallet (initially 0 balance)
    console.log("\n[TEST 1] Get or Create Wallet with 0 balance");
    const initWallet = await walletService.getWallet(testUserId);
    console.assert(initWallet.balance === 0, `Expected balance 0, got ${initWallet.balance}`);
    console.assert(initWallet.version === 0, `Expected version 0, got ${initWallet.version}`);
    console.log(`[PASS] Initial wallet created with balance: ${initWallet.balance} paise`);

    // Test 2: Atomic Credit of ₹500 (50000 paise)
    console.log("\n[TEST 2] Atomic Credit ₹500 (50000 paise)");
    const creditResult = await walletService.credit({
        userId: testUserId,
        amount: 50000,
        reason: "topup",
        referenceId: "test_ref_001",
        description: "Test initial topup",
    });
    console.assert(creditResult.wallet.balance === 50000, `Expected balance 50000, got ${creditResult.wallet.balance}`);
    console.assert(creditResult.transaction.type === "credit", `Expected transaction credit`);
    console.assert(creditResult.transaction.balanceAfter === 50000, `Expected balanceAfter 50000`);
    console.log(`[PASS] Credited ₹500. Wallet balance: ${creditResult.wallet.balance} paise, Version: ${creditResult.wallet.version}`);

    // Test 3: Reject floating point and negative amounts
    console.log("\n[TEST 3] Reject float and negative amounts");
    let floatFailed = false;
    try {
        await walletService.credit({
            userId: testUserId,
            amount: 49.99 as any,
            reason: "topup",
        });
    } catch {
        floatFailed = true;
    }
    console.assert(floatFailed, "Float amount should have thrown an error");
    console.log("[PASS] Float amount rejected successfully");

    // Test 4: Atomic Debit of ₹200 (20000 paise)
    console.log("\n[TEST 4] Atomic Debit ₹200 (20000 paise)");
    const debitResult = await walletService.debit({
        userId: testUserId,
        amount: 20000,
        reason: "premium_purchase",
        referenceId: "test_ref_002",
        description: "Test premium purchase debit",
    });
    console.assert(debitResult.wallet.balance === 30000, `Expected balance 30000, got ${debitResult.wallet.balance}`);
    console.assert(debitResult.transaction.balanceAfter === 30000, `Expected balanceAfter 30000`);
    console.log(`[PASS] Debited ₹200. Remaining balance: ${debitResult.wallet.balance} paise, Version: ${debitResult.wallet.version}`);

    // Test 5: Reject Debit exceeding balance (insufficient funds)
    console.log("\n[TEST 5] Overdraft protection (Debit ₹400 when balance is ₹300)");
    let overdraftFailed = false;
    try {
        await walletService.debit({
            userId: testUserId,
            amount: 40000,
            reason: "premium_purchase",
            referenceId: "test_ref_003",
        });
    } catch (err: any) {
        overdraftFailed = true;
        console.log(`[PASS] Overdraft prevented with error: "${err.message}"`);
    }
    console.assert(overdraftFailed, "Overdraft must fail");

    // Verify balance was untouched
    const afterFailedDebitWallet = await walletService.getWallet(testUserId);
    console.assert(afterFailedDebitWallet.balance === 30000, "Balance must remain unchanged after failed debit");
    console.log(`[PASS] Balance unchanged at ${afterFailedDebitWallet.balance} paise`);

    // Test 6: Ledger Reconciliation
    console.log("\n[TEST 6] Ledger Reconciliation (sum of ledger == wallet balance)");
    const recon = await walletService.reconcile(testUserId);
    console.assert(recon.isBalanced, "Wallet and Ledger must balance");
    console.assert(recon.walletBalance === recon.ledgerBalance, "Wallet balance must equal ledger balance");
    console.log(`[PASS] Reconciled: Wallet = ${recon.walletBalance} paise, Ledger = ${recon.ledgerBalance} paise, Balanced: ${recon.isBalanced}`);

    // Clean up test data
    await walletModel.deleteMany({ userId: testUserId });
    await walletTransactionModel.deleteMany({ userId: testUserId });

    console.log("\n==========================================");
    console.log("ALL PHASE 1 TESTS PASSED SUCCESSFULLY! ✅");
    console.log("==========================================");
    process.exit(0);
}

runPhase1Tests().catch((err) => {
    console.error("Phase 1 test failed with error:", err);
    process.exit(1);
});
