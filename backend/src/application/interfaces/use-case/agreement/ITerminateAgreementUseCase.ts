import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface TerminateAgreementDto {
    status: "ended" | "cancelled";
    reason?: string | undefined;
}

export interface ITerminateAgreementUseCase {
    execute(
        agreementId: string,
        userId: string,
        dto: TerminateAgreementDto
    ): Promise<AgreementResponseDto>;
}
