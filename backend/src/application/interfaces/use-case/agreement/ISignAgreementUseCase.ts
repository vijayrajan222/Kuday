import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface ISignAgreementUseCase {
  execute(userId: string, agreementId: string, clientIp: string): Promise<AgreementResponseDto>;
}
