import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { VerifyAgreementPaymentDto } from "@application/dto/agreement/VerifyAgreementPaymentDto";

export interface IVerifyAgreementPaymentUseCase {
  execute(
    userId: string,
    agreementId: string,
    dto: VerifyAgreementPaymentDto
  ): Promise<AgreementResponseDto>;
}
