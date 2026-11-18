import type { AgreementUnlockStatusResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface ICheckAgreementUnlockUseCase {
    execute(hostId: string, seekerId: string, roomId: string): Promise<AgreementUnlockStatusResponseDto>;
}
