export interface HandleAgreementWebhookInputDto {
  rawBody: string;
  signature: string;
  eventData: unknown;
}

export interface HandleAgreementWebhookOutputDto {
  handled: boolean;
  message: string;
}
