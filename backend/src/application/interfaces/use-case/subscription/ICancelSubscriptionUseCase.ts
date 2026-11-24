import type {
    CancelSubscriptionInputDto,
    CancelSubscriptionOutputDto,
    RequestRefundInput,
    RequestRefundOutput,
    CancelSubscriptionInput,
    CancelSubscriptionOutput,
} from "@application/dto/subscription/SubscriptionDto";

export type {
    RequestRefundInput,
    RequestRefundOutput,
    CancelSubscriptionInput,
    CancelSubscriptionOutput,
    CancelSubscriptionInputDto,
    CancelSubscriptionOutputDto,
};

export interface ICancelSubscriptionUseCase {
    execute(input: CancelSubscriptionInputDto): Promise<CancelSubscriptionOutputDto>;
}
