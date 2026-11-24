import type {
    HandleWebhookInputDto,
    HandleWebhookOutputDto,
    HandleWebhookInput,
} from "@application/dto/payment/PaymentDto";

export type { HandleWebhookInput, HandleWebhookInputDto, HandleWebhookOutputDto };

export interface IHandleWebhookUseCase {
    execute(input: HandleWebhookInputDto): Promise<HandleWebhookOutputDto>;
}
