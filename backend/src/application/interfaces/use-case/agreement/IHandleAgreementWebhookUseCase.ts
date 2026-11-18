export interface IHandleAgreementWebhookUseCase {
  execute(rawBody: string, signature: string, eventData: unknown): Promise<{ handled: boolean; message: string }>;
}
