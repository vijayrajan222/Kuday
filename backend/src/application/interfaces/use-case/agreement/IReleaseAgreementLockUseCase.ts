import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface IReleaseAgreementLockUseCase {
    execute(agreementId: string, userId: string): Promise<AgreementResponseDto>;
}
