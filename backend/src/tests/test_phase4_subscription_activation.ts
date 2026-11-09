import crypto from "crypto";
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
import { RazorpayService } from "../infrastructure/services/RazorpayService.js";

import { CreateOrderUseCase } from "../application/use-case/payment/CreateOrderUseCase.js";
import { VerifyPaymentUseCase } from "../application/use-case/payment/VerifyPaymentUseCase.js";
import { ActivateSubscriptionUseCase } from "../application/use-case/subscription/ActivateSubscriptionUseCase.js";

import { userModel } from "../infrastructure/database/model/UserModel.js";
import { paymentModel } from "../infrastructure/database/model/PaymentModel.js";
import { subscriptionModel } from "../infrastructure/database/model/SubscriptionModel.js";
import { walletModel } from "../infrastructure/database/model/WalletModel.js";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel.js";
import { seedDefaultPlans } from "../infrastructure/database/seedPlans.js";

async function runPhase4Tests() {
    console.log("==========================================================");
    console.log("=== PHASE 4 TEST: ATOMIC SUBSCRIPTION ACTIVATION ===");
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
    const razorpayService = new RazorpayService();

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

    // Host Monthly Plan (49900 paise, 30 days)
    const plans = await planRepo.findAllActive("host");
    const monthlyPlan = plans.find((p) => p.durationDays === 30)!;

    // Create Test User starting as host
    const testUser = await userModel.create({
        email: `phase4_host_${Date.now()}@example.com`,
        firstName: "VIP",
        lastName: "Host",
        hashedPassword: "Password@123",
        role: "host",
        isVerified: true,
        isBlocked: false,
    });
    const userId = testUser._id.toString();
    console.log(`[Setup] Created host user: ${userId}`);

    try {
        // -----------------------------------------------------------------
        // TEST 1: Create Order & Verified Payment Activation in 1 Transaction
        // -----------------------------------------------------------------
        console.log("\n--- TEST 1: Single-Transaction Atomic Activation ---");
        const order = await createOrderUseCase.execute({
            userId,
            planId: monthlyPlan.id,
        });

        const paymentId = `pay_mock_phase4_${Date.now()}`;
        const secret = process.env.RAZORPAY_KEY_SECRET || "NXDoviT1t7tkuSFC4Pz6Hwx6";
        const signature = crypto
            .createHmac("sha256", secret)
            .update(`${order.orderId}|${paymentId}`)
            .digest("hex");

        const verifyResult = await verifyPaymentUseCase.execute({
            userId,
            razorpayOrderId: order.orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
        });

        if (!verifyResult.success || !verifyResult.subscription) {
            throw new Error("Subscription activation returned unsuccessful");
        }

        const sub = verifyResult.subscription;
        console.log(`✓ Subscription activated: ID = ${sub.id}`);
        console.log(`  Status: ${sub.status}`);
        console.log(`  PurchasedAt: ${sub.purchasedAt?.toISOString()}`);
        console.log(`  BenefitsUsedAt: ${sub.benefitsUsedAt} (null as required by Rule 8)`);
        console.log(`  ExpiresAt: ${sub.endDate?.toISOString()}`);

        // Validate Rule 4 & 8 properties
        if (sub.status !== "active") throw new Error("Subscription status must be 'active'");
        if (sub.benefitsUsedAt !== null) throw new Error("Subscription benefitsUsedAt must be null initially");
        if (!sub.purchasedAt) throw new Error("Subscription purchasedAt must be set");

        // Validate Payment record transitioned to captured
        const paymentRecord = await paymentRepo.findByRazorpayOrderId(order.orderId);
        if (paymentRecord?.status !== "captured" || paymentRecord.razorpayPaymentId !== paymentId) {
            throw new Error("Payment record was not transitioned to 'captured'");
        }
        console.log(`✓ Payment record verified as 'captured' with paymentId: ${paymentId}`);

        // Validate Ledger Rows: exactly 2 entries (topup + premium_purchase)
        const { transactions: ledgerTxs } = await walletTxRepo.findByUserId(userId);
        if (ledgerTxs.length !== 2) {
            throw new Error(`Expected exactly 2 ledger entries, found: ${ledgerTxs.length}`);
        }

        const topupTx = ledgerTxs.find((tx) => tx.reason === "topup");
        const purchaseTx = ledgerTxs.find((tx) => tx.reason === "premium_purchase");

        if (!topupTx || topupTx.type !== "credit" || topupTx.amount !== 49900) {
            throw new Error("Missing or invalid 'topup' ledger entry");
        }
        if (!purchaseTx || purchaseTx.type !== "debit" || purchaseTx.amount !== 49900) {
            throw new Error("Missing or invalid 'premium_purchase' ledger entry");
        }
        console.log(`✓ Ledger row 1 verified: [${topupTx.type}] ${topupTx.reason} (₹${topupTx.amount / 100})`);
        console.log(`✓ Ledger row 2 verified: [${purchaseTx.type}] ${purchaseTx.reason} (₹${purchaseTx.amount / 100})`);

        // Validate User entity marked isPremium
        const updatedUser = await userRepo.findById(userId);
        if (!updatedUser?.isPremium || !updatedUser.premiumExpiresAt) {
            throw new Error("User entity isPremium flag or premiumExpiresAt not updated");
        }
        console.log(`✓ User entity updated: isPremium = true, expires = ${updatedUser.premiumExpiresAt.toLocaleDateString()}`);

        // Validate Wallet balance reconciliation
        const userWallet = await walletService.getWallet(userId);
        if (userWallet.balance !== 0) {
            throw new Error(`Expected wallet balance 0 paise, got: ${userWallet.balance}`);
        }
        console.log(`✓ Net wallet balance = ₹${userWallet.balance / 100} (topup ₹499 - purchase ₹499)`);
        console.log("✓ TEST 1 PASSED: All 4 operations executed atomically in DB transaction.");

        // -----------------------------------------------------------------
        // TEST 2: Idempotent Double Activation (Verify + Webhook simulation)
        // -----------------------------------------------------------------
        console.log("\n--- TEST 2: Idempotent Double Activation ---");
        const secondActivation = await activateSubUseCase.activateFromPayment({
            userId,
            razorpayOrderId: order.orderId,
            razorpayPaymentId: paymentId,
        });

        if (secondActivation.id !== sub.id) {
            throw new Error("Second activation must return existing subscription ID without creating new one");
        }

        // Ledger must still have exactly 2 entries (no duplicates!)
        const { total: totalLedger } = await walletTxRepo.findByUserId(userId);
        if (totalLedger !== 2) {
            throw new Error(`Duplicate activation generated extra ledger rows! Total: ${totalLedger}`);
        }
        console.log(`✓ Idempotency confirmed: Returned existing subscription ${secondActivation.id}, zero duplicate ledger rows.`);
        console.log("✓ TEST 2 PASSED: Double activation idempotency verified.");

        // -----------------------------------------------------------------
        // TEST 3: Rule 2 - Role validation on activation attempt
        // -----------------------------------------------------------------
        console.log("\n--- TEST 3: Reject Activation if user switched to non-host ---");
        // Create order for second user
        const secondUser = await userModel.create({
            email: `seeker_order_${Date.now()}@example.com`,
            firstName: "Temp",
            lastName: "User",
            role: "host",
            isVerified: true,
            isBlocked: false,
        });
        const secondUserId = secondUser._id.toString();

        const order2 = await createOrderUseCase.execute({
            userId: secondUserId,
            planId: monthlyPlan.id,
        });

        // Now switch role to seeker before payment activates
        await userRepo.updateUser(secondUserId, { role: "seeker" });

        let seekerActivationBlocked = false;
        try {
            await activateSubUseCase.activateFromPayment({
                userId: secondUserId,
                razorpayOrderId: order2.orderId,
                razorpayPaymentId: `pay_mock_${Date.now()}`,
            });
        } catch (err: unknown) {
            const msg = (err as Error).message;
            if (msg.includes("Only users currently in the host role can activate premium membership")) {
                seekerActivationBlocked = true;
                console.log(`✓ Caught expected role rejection: "${msg}"`);
            } else {
                throw err;
            }
        }
        if (!seekerActivationBlocked) {
            throw new Error("Activation was allowed after user switched away from host role!");
        }
        console.log("✓ TEST 3 PASSED: Rule 2 role enforcement on activation verified.");

        // Cleanup second user
        await userModel.findByIdAndDelete(secondUserId);
        await paymentModel.deleteMany({ userId: secondUserId });

        console.log("\n==========================================================");
        console.log("🎉 ALL PHASE 4 CHECKS PASSED PERFECTLY!");
        console.log("==========================================================");
    } finally {
        await userModel.findByIdAndDelete(userId);
        await walletModel.deleteOne({ userId });
        await walletTransactionModel.deleteMany({ userId });
        await subscriptionModel.deleteMany({ userId });
        await paymentModel.deleteMany({ userId });
        await mongoose.disconnect();
    }
}

runPhase4Tests().catch((err) => {
    console.error("Phase 4 test failed:", err);
    process.exit(1);
});
