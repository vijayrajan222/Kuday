import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";
import type {
    ActivateFromPaymentDto,
    ActivateFromWalletDto,
    ActivateFromPaymentInput,
    ActivateFromWalletInput,
} from "@application/dto/subscription/SubscriptionDto";

export type {
    ActivateFromPaymentInput,
    ActivateFromWalletInput,
    ActivateFromPaymentDto,
    ActivateFromWalletDto,
};

export interface IActivateSubscriptionUseCase {
    activateFromPayment(input: ActivateFromPaymentDto): Promise<SubscriptionEntity>;
    activateFromWallet(input: ActivateFromWalletDto): Promise<SubscriptionEntity>;
}
