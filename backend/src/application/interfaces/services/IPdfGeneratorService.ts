import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface IPdfGeneratorService {
  generateAgreementPdf(agreement: AgreementResponseDto): Promise<Buffer>;
}
