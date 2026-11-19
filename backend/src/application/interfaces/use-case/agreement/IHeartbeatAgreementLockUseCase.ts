import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface IHeartbeatAgreementLockUseCase {
    execute(agreementId: string, userId: string): Promise<AgreementResponseDto>;
}
