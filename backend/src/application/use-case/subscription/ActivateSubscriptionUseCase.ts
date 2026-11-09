import mongoose, { type ClientSession } from "mongoose";
import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IWalletService } from "@application/interfaces/services/IWalletService";
import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";
import { AppError } from "@application/errors/AppError";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export interface ActivateFromPaymentInput {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    method?: string | undefined;
}

export interface ActivateFromWalletInput {
    userId: string;
    planId: string;
}

export class ActivateSubscriptionUseCase {
    constructor(
        private readonly paymentRepo: IPaymentRepository,
        private readonly planRepo: IPlanRepository,
        private readonly subRepo: ISubscriptionRepository,
        private readonly userRepo: IUserRepository,
        private readonly walletService: IWalletService
    ) {}

    /**
     * Atomically activates a subscription upon verified Razorpay payment.
     * Enforces single DB transaction: payment captured + subscription created + wallet ledger recorded + user updated.
     */
    async activateFromPayment(input: ActivateFromPaymentInput): Promise<SubscriptionEntity> {
        const { userId, razorpayOrderId, razorpayPaymentId, method } = input;

        // 1. Fetch Payment Record
        const payment = await this.paymentRepo.findByRazorpayOrderId(razorpayOrderId);
        if (!payment) {
            throw new AppError("Payment record not found for order", HttpStatusCodes.NOT_FOUND);
        }
        if (payment.userId !== userId) {
            throw new AppError("Unauthorized subscription activation request", HttpStatusCodes.FORBIDDEN);
        }

        // Rule 2: Validate User is in host role
        const user = await this.userRepo.findById(userId);
        if (!user || user.role !== "host") {
            throw new AppError("Only users currently in the host role can activate premium membership", HttpStatusCodes.FORBIDDEN);
        }

        // 2. Fetch Plan
        if (!payment.planId) {
            throw new AppError("Payment record does not have an associated planId", HttpStatusCodes.BAD_REQUEST);
        }
        const plan = await this.planRepo.findById(payment.planId);
        if (!plan) {
            throw new AppError("Associated membership plan not found", HttpStatusCodes.NOT_FOUND);
        }

        // 3. Idempotency Check: "verify + webhook both firing -> activate only once"
        const existingActive = await this.subRepo.findActiveByUserId(userId);
        if (existingActive && existingActive.paymentId === payment.id) {
            console.log(`[Subscription] Order ${razorpayOrderId} already activated subscription ${existingActive.id}. Returning existing.`);
            return existingActive;
        }

        // 4. Atomic Execution inside one MongoDB transaction
        const session: ClientSession = await mongoose.startSession();
        let activatedSub!: SubscriptionEntity;

        try {
            await session.withTransaction(async () => {
                // a. Transition Payment to captured
                await this.paymentRepo.updateStatus(
                    payment.id,
                    "captured",
                    {
                        razorpayPaymentId,
                        method: method ?? undefined,
                    },
                    session
                );

                // b. Calculate subscription start & end dates
                const startDate = new Date();
                const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

                // c. Create Subscription with purchasedAt and benefitsUsedAt: null
                activatedSub = await this.subRepo.create(
                    {
                        userId,
                        planId: plan.id,
                        status: "active",
                        startDate,
                        endDate,
                        purchasedAt: startDate,
                        benefitsUsedAt: null,
                        paymentId: payment.id,
                        refundAmount: 0,
                        refundStatus: "none",
                    },
                    session
                );

                // d. Record Topup Credit in Ledger
                await this.walletService.credit(
                    {
                        userId,
                        amount: payment.amount,
                        reason: "topup",
                        referenceId: payment.id,
                        description: `Payment captured via Razorpay (${razorpayPaymentId}) for ${plan.name}`,
                    },
                    session
                );

                // e. Record Premium Purchase Debit in Ledger
                await this.walletService.debit(
                    {
                        userId,
                        amount: payment.amount,
                        reason: "premium_purchase",
                        referenceId: activatedSub.id,
                        description: `Premium membership activated: ${plan.name}`,
                    },
                    session
                );

                // f. Update User Entity with isPremium status and expiry
                await this.userRepo.updateUser(
                    userId,
                    {
                        isPremium: true,
                        premiumExpiresAt: endDate,
                    },
                    session
                );
            });

            console.log(
                `[Subscription] Successfully activated subscription ${activatedSub.id} for user ${userId} (Plan: ${plan.name}, Expires: ${activatedSub.endDate?.toISOString()})`
            );

            return activatedSub;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            // Fallback for non-replica set local dev MongoDB
            if (msg.includes("replica set") || msg.includes("Transaction numbers are only allowed")) {
                console.warn("[Subscription] Running in non-replica set mode (sequential fallback)");
                await this.paymentRepo.updateStatus(payment.id, "captured", {
                    razorpayPaymentId,
                    method: method ?? undefined,
                });

                const startDate = new Date();
                const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

                activatedSub = await this.subRepo.create({
                    userId,
                    planId: plan.id,
                    status: "active",
                    startDate,
                    endDate,
                    purchasedAt: startDate,
                    benefitsUsedAt: null,
                    paymentId: payment.id,
                    refundAmount: 0,
                    refundStatus: "none",
                });

                await this.walletService.credit({
                    userId,
                    amount: payment.amount,
                    reason: "topup",
                    referenceId: payment.id,
                    description: `Payment captured via Razorpay (${razorpayPaymentId}) for ${plan.name}`,
                });

                await this.walletService.debit({
                    userId,
                    amount: payment.amount,
                    reason: "premium_purchase",
                    referenceId: activatedSub.id,
                    description: `Premium membership activated: ${plan.name}`,
                });

                await this.userRepo.updateUser(userId, {
                    isPremium: true,
                    premiumExpiresAt: endDate,
                });

                return activatedSub;
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Atomically activates a subscription using the user's available wallet balance.
     */
    async activateFromWallet(input: ActivateFromWalletInput): Promise<SubscriptionEntity> {
        const { userId, planId } = input;

        // 1. Check existing active subscription
        const activeSub = await this.subRepo.findActiveByUserId(userId);
        if (activeSub && activeSub.status === "active" && activeSub.endDate && activeSub.endDate > new Date()) {
            throw new AppError(
                `You already have an active premium membership until ${activeSub.endDate.toLocaleDateString()}`,
                HttpStatusCodes.BAD_REQUEST
            );
        }

        // Rule 2: Validate User is in host role
        const user = await this.userRepo.findById(userId);
        if (!user || user.role !== "host") {
            throw new AppError("Only users currently in the host role can activate premium membership", HttpStatusCodes.FORBIDDEN);
        }

        // 2. Fetch Plan
        const plan = await this.planRepo.findById(planId);
        if (!plan || !plan.isActive) {
            throw new AppError("Invalid or inactive plan", HttpStatusCodes.BAD_REQUEST);
        }
        if (plan.audience && plan.audience !== "host") {
            throw new AppError("Selected plan is not available for hosts", HttpStatusCodes.BAD_REQUEST);
        }

        const session: ClientSession = await mongoose.startSession();
        let activatedSub!: SubscriptionEntity;

        try {
            await session.withTransaction(async () => {
                const startDate = new Date();
                const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

                // a. Create Subscription
                activatedSub = await this.subRepo.create(
                    {
                        userId,
                        planId: plan.id,
                        status: "active",
                        startDate,
                        endDate,
                        purchasedAt: startDate,
                        benefitsUsedAt: null,
                        refundAmount: 0,
                        refundStatus: "none",
                    },
                    session
                );

                // b. Atomic Debit with balance >= amount check
                await this.walletService.debit(
                    {
                        userId,
                        amount: plan.price,
                        reason: "premium_purchase",
                        referenceId: activatedSub.id,
                        description: `Premium membership purchased from wallet: ${plan.name}`,
                    },
                    session
                );

                // c. Update User Entity
                await this.userRepo.updateUser(
                    userId,
                    {
                        isPremium: true,
                        premiumExpiresAt: endDate,
                    },
                    session
                );
            });

            return activatedSub;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            if (msg.includes("replica set") || msg.includes("Transaction numbers are only allowed")) {
                const startDate = new Date();
                const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

                activatedSub = await this.subRepo.create({
                    userId,
                    planId: plan.id,
                    status: "active",
                    startDate,
                    endDate,
                    purchasedAt: startDate,
                    benefitsUsedAt: null,
                    refundAmount: 0,
                    refundStatus: "none",
                });

                await this.walletService.debit({
                    userId,
                    amount: plan.price,
                    reason: "premium_purchase",
                    referenceId: activatedSub.id,
                    description: `Premium membership purchased from wallet: ${plan.name}`,
                });

                await this.userRepo.updateUser(userId, {
                    isPremium: true,
                    premiumExpiresAt: endDate,
                });

                return activatedSub;
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
