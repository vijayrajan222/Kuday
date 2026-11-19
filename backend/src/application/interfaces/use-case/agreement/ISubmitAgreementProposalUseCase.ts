import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { CommonTerms, CustomClauseEntity } from "@domain/entities/AgreementEntity";

export interface SubmitAgreementProposalDto {
    revision: number;
    commonTerms?: CommonTerms | undefined;
    customClauses?: CustomClauseEntity[] | undefined;
}

export interface ISubmitAgreementProposalUseCase {
    execute(agreementId: string, userId: string, dto: SubmitAgreementProposalDto): Promise<AgreementResponseDto>;
}
