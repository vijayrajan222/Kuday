export interface GetAgreementPdfInputDto {
  userId: string;
  agreementId: string;
}

export interface GetAgreementPdfOutputDto {
  buffer: Buffer;
  fileName: string;
}
