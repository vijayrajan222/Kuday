import type { CommonTerms } from "@domain/entities/AgreementEntity";

export interface ProposeCommonTermsDto {
    agreementId: string;
    userId: string;
    terms: CommonTerms;
}

export interface RespondCommonTermsDto {
    agreementId: string;
    userId: string;
    action: "accept" | "reject";
}
