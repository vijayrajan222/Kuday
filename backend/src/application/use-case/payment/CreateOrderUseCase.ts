import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRazorpayService } from "@application/interfaces/services/IRazorpayService";
import type {
    ICreateOrderUseCase,
    CreateOrderInput,
    CreateOrderOutput,
} from "@application/interfaces/use-case/payment/ICreateOrderUseCase";
import { NotFoundError, ForbiddenError, ValidationError } from "@application/errors/AppError";

export type { CreateOrderInput, CreateOrderOutput };

export class CreateOrderUseCase implements ICreateOrderUseCase {
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
            throw new NotFoundError("User not found");
        }
        if (user.isBlocked) {
            throw new ForbiddenError("Account is blocked. Payments not permitted.");
        }

        // Rule 2: Only users currently in the HOST role can buy premium
        if (user.role !== "host") {
            throw new ForbiddenError("Only users currently in the host role can purchase premium membership");
        }

        // 2. Rule 5: A host with an active premium cannot buy another one.
        const activeSub = await this.subRepo.findActiveByUserId(input.userId);
        if (activeSub && activeSub.status === "active" && activeSub.endDate && activeSub.endDate > new Date()) {
            throw new ValidationError(
                `You already have an active premium membership until ${activeSub.endDate.toLocaleDateString()}`
            );
        }

        // 3. Fetch Plan (NEVER trust frontend price/amount)
        const plan = await this.planRepo.findById(input.planId);
        if (!plan || !plan.isActive) {
            throw new ValidationError("Selected membership plan is invalid or no longer active");
        }
        if (plan.audience && plan.audience !== "host") {
            throw new ValidationError("Selected plan is not available for hosts");
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
            purpose: "premium",
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
