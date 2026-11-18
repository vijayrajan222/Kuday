import type { AgreementPaymentOrderResponseDto } from "@application/dto/agreement/AgreementPaymentOrderDto";

export interface ICreateAgreementPaymentOrderUseCase {
  execute(userId: string, agreementId: string): Promise<AgreementPaymentOrderResponseDto>;
}
