import type {
    AgreementEntity,
    AgreementStatus,
    CommonTerms,
    ProposedCommonTerms,
    CustomClauseEntity,
    AgreementPayment,
    EditLock,
    AcceptanceTimestamps,
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
    editLock: EditLock;
    revision: number;
    pendingWith?: string | null | undefined;
    lastSubmittedBy?: string | null | undefined;
    acceptedBy: string[];
    acceptanceTimestamps: AcceptanceTimestamps;
    payment: AgreementPayment;
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
    visitCompleted?: boolean | undefined;
    callCompleted?: boolean | undefined;
    activeAgreementId?: string | undefined;
}
