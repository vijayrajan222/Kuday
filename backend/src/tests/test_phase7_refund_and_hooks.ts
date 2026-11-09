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
import { PremiumHookService } from "../application/services/PremiumHookService.js";

import { ActivateSubscriptionUseCase } from "../application/use-case/subscription/ActivateSubscriptionUseCase.js";
import { RequestRefundUseCase } from "../application/use-case/subscription/CancelSubscriptionUseCase.js";
import { GetActiveSubscriptionUseCase } from "../application/use-case/subscription/GetActiveSubscriptionUseCase.js";

import { userModel } from "../infrastructure/database/model/UserModel.js";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel.js";
import { walletModel } from "../infrastructure/database/model/WalletModel.js";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel.js";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans.js";

async function runPhase7Tests() {
    console.log("==========================================================");
    console.log("=== PHASE 7 TEST: REFUND FLOW & GATING HOOKS (KUDAI) ===");
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

    const requestRefundUseCase = new RequestRefundUseCase(
        subRepo,
        planRepo,
        paymentRepo,
        userRepo,
        walletService
    );

    const getActiveSubUseCase = new GetActiveSubscriptionUseCase(
        subRepo,
        planRepo,
        paymentRepo
    );

    const hookService = new PremiumHookService(userRepo, subRepo);

    // Host Monthly Plan (49900 paise, ₹499)
    const plans = await planRepo.findAllActive("host");
    const monthlyPlan = plans.find((p) => p.durationDays === 30)!;

    // Create Test Host User
    const hostUser = await userModel.create({
        email: `phase7_host_${Date.now()}@example.com`,
        firstName: "Hook",
        lastName: "Tester",
        hashedPassword: "Password@123",
        role: "host",
        isVerified: true,
        isBlocked: false,
    });
    const hostId = hostUser._id.toString();

    // Top up host wallet with ₹1,000
    await walletService.credit({
        userId: hostId,
        amount: 100000,
        reason: "topup",
    });
    console.log(`[Setup] Created host ${hostId} with ₹1,000 wallet balance`);

    try {
        // -----------------------------------------------------------------
        // TEST 1: Rule 7 - Full Refund within 3-day Window to Wallet
        // -----------------------------------------------------------------
        console.log("\n--- TEST 1: Full Refund within 3-day Window (Rule 7) ---");
        // Activate subscription from wallet
        const sub1 = await activateSubUseCase.activateFromWallet({
            userId: hostId,
            planId: monthlyPlan.id,
        });
        console.log(`Subscribed to ${monthlyPlan.name}. Wallet balance before refund: ₹${(await walletService.getWallet(hostId)).balance / 100}`);

        // Check eligibility via GetActiveSubscriptionUseCase
        const activeDetails = await getActiveSubUseCase.execute(hostId);
        if (!activeDetails.isRefundEligible) {
            throw new Error("Active subscription within 3 days must be refund-eligible");
        }
        console.log(`✓ Active subscription eligibility confirmed: isRefundEligible = ${activeDetails.isRefundEligible}`);

        // Execute refund
        const refundResult = await requestRefundUseCase.execute({
            userId: hostId,
            subscriptionId: sub1.id,
            reason: "Found roommate early",
        });

        if (refundResult.refundAmount !== 49900 || refundResult.subscription.status !== "refunded") {
            throw new Error(`Refund execution failed: ${JSON.stringify(refundResult)}`);
        }
        console.log(`✓ Subscription refunded: status = "${refundResult.subscription.status}", amount = ₹${refundResult.refundAmount / 100}`);

        // Verify user isPremium ended immediately
        const userAfterRefund = await userRepo.findById(hostId);
        if (userAfterRefund?.isPremium) {
            throw new Error("User isPremium flag was not revoked upon refund!");
        }
        console.log("✓ User isPremium flag immediately revoked");

        // Verify ledger row with reason 'premium_refund'
        const { transactions: hostTxs } = await walletTxRepo.findByUserId(hostId);
        const refundTx = hostTxs.find((tx) => tx.reason === "premium_refund");
        if (!refundTx || refundTx.type !== "credit" || refundTx.amount !== 49900) {
            throw new Error("Missing or invalid 'premium_refund' ledger credit");
        }
        console.log(`✓ Double-entry ledger row confirmed: [${refundTx.type}] ${refundTx.reason} (+₹${refundTx.amount / 100})`);

        // Wallet balance fully restored to ₹1,000
        const walletAfterRefund = await walletService.getWallet(hostId);
        if (walletAfterRefund.balance !== 100000) {
            throw new Error(`Wallet balance not fully restored: ${walletAfterRefund.balance}`);
        }
        console.log(`✓ Wallet balance restored: ₹${walletAfterRefund.balance / 100}`);
        console.log("✓ TEST 1 PASSED: Rule 7 Full refund to wallet in 1 transaction verified.");

        // -----------------------------------------------------------------
        // TEST 2: Rule 7 Defense - Double Refund Rejected
        // -----------------------------------------------------------------
        console.log("\n--- TEST 2: Double Refund Rejection ---");
        let doubleRefundCaught = false;
        try {
            await requestRefundUseCase.execute({
                userId: hostId,
                subscriptionId: sub1.id,
            });
        } catch (err: unknown) {
            const msg = (err as Error).message;
            if (msg.includes("already been refunded")) {
                doubleRefundCaught = true;
                console.log(`✓ Caught expected double-refund rejection: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!doubleRefundCaught) throw new Error("Double refund was allowed!");
        console.log("✓ TEST 2 PASSED: Double refund prevented.");

        // -----------------------------------------------------------------
        // TEST 3: Rule 7 & 8 - Reject Refund if Benefits Have Been Used
        // -----------------------------------------------------------------
        console.log("\n--- TEST 3: Reject Refund if benefitsUsedAt is set (Rule 7 & 8) ---");
        // Buy fresh subscription
        const sub2 = await activateSubUseCase.activateFromWallet({
            userId: hostId,
            planId: monthlyPlan.id,
        });

        // Rule 8 Hook: simulate future video call / agreement calling markPremiumBenefitsUsed
        await hookService.markPremiumBenefitsUsed(hostId);
        console.log("markPremiumBenefitsUsed(hostId) executed -> benefitsUsedAt is set to Date");

        const subWithBenefits = await subRepo.findById(sub2.id);
        if (!subWithBenefits?.benefitsUsedAt) {
            throw new Error("benefitsUsedAt was not set by hook!");
        }

        // Get active details: button must be ineligible
        const detailsAfterBenefits = await getActiveSubUseCase.execute(hostId);
        if (detailsAfterBenefits.isRefundEligible) {
            throw new Error("Subscription with used benefits must not be refund-eligible!");
        }
        console.log(`✓ isRefundEligible correctly returned false: button hidden on UI`);

        let benefitsBlockCaught = false;
        try {
            await requestRefundUseCase.execute({
                userId: hostId,
                subscriptionId: sub2.id,
            });
        } catch (err: unknown) {
            const msg = (err as Error).message;
            if (msg.includes("premium benefits have already been used")) {
                benefitsBlockCaught = true;
                console.log(`✓ Caught expected benefits block: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!benefitsBlockCaught) throw new Error("Refund with used benefits was allowed!");
        console.log("✓ TEST 3 PASSED: Rule 7 benefits used defense verified.");

        // -----------------------------------------------------------------
        // TEST 4: Rule 7 Defense - Reject Refund after 3-day Window Expired
        // -----------------------------------------------------------------
        console.log("\n--- TEST 4: Reject Refund after 3-day Window Expired ---");
        // Expire sub2 and create a sub with purchasedAt 4 days ago
        await subscriptionModel.findByIdAndUpdate(sub2.id, { status: "refunded" });

        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
        const sub3 = await activateSubUseCase.activateFromWallet({
            userId: hostId,
            planId: monthlyPlan.id,
        });
        // Backdate purchasedAt
        await subscriptionModel.findByIdAndUpdate(sub3.id, {
            purchasedAt: fourDaysAgo,
            startDate: fourDaysAgo,
        });

        let windowExpiredCaught = false;
        try {
            await requestRefundUseCase.execute({
                userId: hostId,
                subscriptionId: sub3.id,
            });
        } catch (err: unknown) {
            const msg = (err as Error).message;
            if (msg.includes("Refund window has expired")) {
                windowExpiredCaught = true;
                console.log(`✓ Caught expected expired window rejection: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!windowExpiredCaught) throw new Error("Refund after window was allowed!");
        console.log("✓ TEST 4 PASSED: 3-day refund window strictly enforced.");

        // -----------------------------------------------------------------
        // TEST 5: Rule 8 & 9 - isHostPremium & Role Switch (Dormant)
        // -----------------------------------------------------------------
        console.log("\n--- TEST 5: isHostPremium & Dormant on Role Switch (Rule 8 & 9) ---");
        // 1. Subscribed host -> isHostPremium returns true
        const isPremium1 = await hookService.isHostPremium(hostId);
        if (!isPremium1) throw new Error("Active host must return isHostPremium = true");
        console.log(`✓ Subscribed host: isHostPremium = ${isPremium1}`);

        // 2. Host switches to seeker (Rule 9: dormant, keep subscription, no auto-refund)
        await userRepo.updateUser(hostId, { role: "seeker" });
        const isPremiumDormant = await hookService.isHostPremium(hostId);
        if (isPremiumDormant) {
            throw new Error("When switched to seeker, isHostPremium must return false (dormant)!");
        }
        console.log(`✓ Switched to seeker role: isHostPremium = ${isPremiumDormant} (dormant)`);

        // 3. User switches back to host -> subscription applies again
        await userRepo.updateUser(hostId, { role: "host" });
        const isPremiumRestored = await hookService.isHostPremium(hostId);
        if (!isPremiumRestored) {
            throw new Error("When switched back to host, isHostPremium must return true!");
        }
        console.log(`✓ Switched back to host: isHostPremium = ${isPremiumRestored} (restored)`);

        // 4. Sub expires (endDate in past) -> returns false
        await subscriptionModel.findByIdAndUpdate(sub3.id, {
            endDate: new Date(Date.now() - 1000),
        });
        const isPremiumExpired = await hookService.isHostPremium(hostId);
        if (isPremiumExpired) {
            throw new Error("Expired subscription must return isHostPremium = false");
        }
        console.log(`✓ Expired subscription: isHostPremium = ${isPremiumExpired}`);
        console.log("✓ TEST 5 PASSED: Rule 8 & 9 hooks and role-switch behavior verified.");

        console.log("\n==========================================================");
        console.log("🎉 ALL PHASE 7 CHECKS PASSED PERFECTLY!");
        console.log("==========================================================");
    } finally {
        await userModel.findByIdAndDelete(hostId);
        await walletModel.deleteOne({ userId: hostId });
        await walletTransactionModel.deleteMany({ userId: hostId });
        await subscriptionModel.deleteMany({ userId: hostId });
        await mongoose.disconnect();
    }
}

runPhase7Tests().catch((err) => {
    console.error("Phase 7 test failed:", err);
    process.exit(1);
});
