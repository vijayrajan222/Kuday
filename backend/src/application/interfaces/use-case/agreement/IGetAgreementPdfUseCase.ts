export interface IGetAgreementPdfUseCase {
  execute(userId: string, agreementId: string): Promise<{ buffer: Buffer; fileName: string }>;
}
