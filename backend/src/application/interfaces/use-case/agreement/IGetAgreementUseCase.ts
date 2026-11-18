import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface IGetAgreementUseCase {
    execute(agreementId: string, callerUserId: string): Promise<AgreementResponseDto>;
}
