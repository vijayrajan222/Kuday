import type {
  HandleAgreementWebhookInputDto,
  HandleAgreementWebhookOutputDto,
} from "@application/dto/agreement/AgreementWebhookDto";

export type { HandleAgreementWebhookInputDto, HandleAgreementWebhookOutputDto };

export interface IHandleAgreementWebhookUseCase {
  execute(input: HandleAgreementWebhookInputDto): Promise<HandleAgreementWebhookOutputDto>;
  execute(rawBody: string, signature: string, eventData: unknown): Promise<HandleAgreementWebhookOutputDto>;
  execute(
    inputOrRawBody: HandleAgreementWebhookInputDto | string,
    signature?: string,
    eventData?: unknown
  ): Promise<HandleAgreementWebhookOutputDto>;
}
