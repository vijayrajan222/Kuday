import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRazorpayService } from "@application/interfaces/services/IRazorpayService";
import type {
    ICreateTopUpOrderUseCase,
    CreateTopUpOrderInput,
    CreateTopUpOrderOutput,
} from "@application/interfaces/use-case/payment/ICreateTopUpOrderUseCase";
import { NotFoundError, ForbiddenError, ValidationError } from "@application/errors/AppError";

export type { CreateTopUpOrderInput, CreateTopUpOrderOutput };

export class CreateTopUpOrderUseCase implements ICreateTopUpOrderUseCase {
    constructor(
        private readonly paymentRepo: IPaymentRepository,
        private readonly userRepo: IUserRepository,
        private readonly razorpayService: IRazorpayService
    ) {}

    async execute(input: CreateTopUpOrderInput): Promise<CreateTopUpOrderOutput> {
        const { userId, amountPaise, idempotencyKey } = input;

        // 1. Validation
        if (!Number.isInteger(amountPaise) || amountPaise < 1000) {
            throw new ValidationError("Top-up amount must be an integer of at least ₹10 (1000 paise)");
        }
        if (amountPaise > 10000000) {
            throw new ValidationError("Maximum top-up amount is ₹100,000");
        }

        // 2. Validate User
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }
        if (user.isBlocked) {
            throw new ForbiddenError("Account is blocked. Transactions not permitted.");
        }

        // 3. Idempotency Check
        if (idempotencyKey) {
            const existingPayment = await this.paymentRepo.findByIdempotencyKey(idempotencyKey);
            if (existingPayment && existingPayment.userId === userId) {
                console.log(`[TopUp] Reusing existing top-up order for idempotencyKey: ${idempotencyKey}`);
                return {
                    orderId: existingPayment.razorpayOrderId,
                    amount: existingPayment.amount,
                    currency: existingPayment.currency || "INR",
                    keyId: this.razorpayService.getKeyId(),
                };
            }
        }

        // 4. Create Razorpay Order
        const receipt = `topup_${userId.slice(-6)}_${Date.now()}`;
        const razorpayOrder = await this.razorpayService.createOrder({
            amount: amountPaise,
            currency: "INR",
            receipt,
            notes: {
                userId,
                type: "wallet_topup",
            },
        });

        // 5. Record Payment in DB
        await this.paymentRepo.create({
            razorpayOrderId: razorpayOrder.id,
            amount: amountPaise,
            status: "created",
            purpose: "wallet_topup",
            userId,
            currency: "INR",
            idempotencyKey: idempotencyKey ?? undefined,
        });

        console.log(`[TopUp] Created Razorpay top-up order ${razorpayOrder.id} for user ${userId} of amount ${amountPaise} paise`);

        return {
            orderId: razorpayOrder.id,
            amount: amountPaise,
            currency: "INR",
            keyId: this.razorpayService.getKeyId(),
        };
    }
}
