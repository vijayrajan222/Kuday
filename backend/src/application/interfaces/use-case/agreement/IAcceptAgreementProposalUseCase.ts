import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface IAcceptAgreementProposalUseCase {
    execute(agreementId: string, userId: string, revision: number): Promise<AgreementResponseDto>;
}
