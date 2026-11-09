import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRazorpayService } from "@application/interfaces/services/IRazorpayService";
import { AppError } from "@application/errors/AppError";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export interface CreateOrderInput {
    userId: string;
    planId: string;
    idempotencyKey?: string | undefined;
}

export interface CreateOrderOutput {
    orderId: string;
    amount: number; // in paise
    currency: string;
    keyId: string;
    plan: {
        id: string;
        name: string;
        price: number;
        durationDays: number;
    };
}

export class CreateOrderUseCase {
    constructor(
        private readonly paymentRepo: IPaymentRepository,
        private readonly planRepo: IPlanRepository,
        private readonly subRepo: ISubscriptionRepository,
        private readonly userRepo: IUserRepository,
        private readonly razorpayService: IRazorpayService
    ) {}

    async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
        // 1. Validate User
        const user = await this.userRepo.findById(input.userId);
        if (!user) {
            throw new AppError("User not found", HttpStatusCodes.NOT_FOUND);
        }
        if (user.isBlocked) {
            throw new AppError("Account is blocked. Payments not permitted.", HttpStatusCodes.FORBIDDEN);
        }

        // 2. Edge Case: User already has an active subscription
        const activeSub = await this.subRepo.findActiveByUserId(input.userId);
        if (activeSub && activeSub.status === "active" && activeSub.endDate && activeSub.endDate > new Date()) {
            throw new AppError(
                `You already have an active premium membership until ${activeSub.endDate.toLocaleDateString()}`,
                HttpStatusCodes.BAD_REQUEST
            );
        }

        // 3. Fetch Plan (NEVER trust frontend price/amount)
        const plan = await this.planRepo.findById(input.planId);
        if (!plan || !plan.isActive) {
            throw new AppError("Selected membership plan is invalid or no longer active", HttpStatusCodes.BAD_REQUEST);
        }

        // 4. Idempotency Check
        if (input.idempotencyKey) {
            const existingPayment = await this.paymentRepo.findByIdempotencyKey(input.idempotencyKey);
            if (existingPayment && existingPayment.userId === input.userId) {
                console.log(`[Payment] Reusing existing order for idempotencyKey: ${input.idempotencyKey}`);
                return {
                    orderId: existingPayment.razorpayOrderId,
                    amount: existingPayment.amount,
                    currency: existingPayment.currency || "INR",
                    keyId: this.razorpayService.getKeyId(),
                    plan: {
                        id: plan.id,
                        name: plan.name,
                        price: plan.price,
                        durationDays: plan.durationDays,
                    },
                };
            }
        }

        // 5. Create Razorpay Order
        const receipt = `rcpt_${input.userId.slice(-6)}_${Date.now()}`;
        const razorpayOrder = await this.razorpayService.createOrder({
            amount: plan.price, // strictly server-side integer paise
            currency: "INR",
            receipt,
            notes: {
                userId: input.userId,
                planId: plan.id,
                planName: plan.name,
            },
        });

        // 6. Record Payment in DB with 'created' status
        await this.paymentRepo.create({
            razorpayOrderId: razorpayOrder.id,
            amount: plan.price,
            status: "created",
            userId: input.userId,
            planId: plan.id,
            idempotencyKey: input.idempotencyKey ?? undefined,
            currency: "INR",
        });

        console.log(`[Payment] Order ${razorpayOrder.id} created for user ${input.userId}, amount: ${plan.price} paise`);

        return {
            orderId: razorpayOrder.id,
            amount: plan.price,
            currency: "INR",
            keyId: this.razorpayService.getKeyId(),
            plan: {
                id: plan.id,
                name: plan.name,
                price: plan.price,
                durationDays: plan.durationDays,
            },
        };
    }
}
