import type {
    AgreementEntity,
    AgreementStatus,
    CommonTerms,
    ProposedCommonTerms,
    CustomClauseEntity,
    AgreementPayment,
    AgreementSignatures,
} from "@domain/entities/AgreementEntity";

export interface AgreementUserSummary {
    id: string;
    firstName: string;
    lastName?: string | undefined;
    email: string;
    role: string;
    selfieUrl?: string | undefined;
    isPremium?: boolean | undefined;
}

export interface AgreementRoomSummary {
    id: string;
    title?: string | undefined;
    roomType: string;
    monthlyRent: number;
    location: string;
    images: string[];
}

export interface AgreementResponseDto {
    id: string;
    hostId: string;
    seekerId: string;
    roomId: string;
    status: AgreementStatus;
    commonTerms: CommonTerms;
    pendingCommonTerms?: ProposedCommonTerms | undefined;
    hostObligations: string[];
    seekerObligations: string[];
    customClauses: CustomClauseEntity[];
    payment: AgreementPayment;
    signatures: AgreementSignatures;
    version: number;
    lockedAt?: string | undefined;
    pdfUrl?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    host?: AgreementUserSummary | undefined;
    seeker?: AgreementUserSummary | undefined;
    room?: AgreementRoomSummary | undefined;
}

export interface AgreementUnlockStatusResponseDto {
    unlocked: boolean;
    reason?: string | undefined;
    visitCompleted: boolean;
    callCompleted: boolean;
    activeAgreementId?: string | undefined;
}
