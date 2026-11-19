export type AgreementStatus =
    | 'draft'
    | 'negotiating'
    | 'awaiting_payment'
    | 'completed'
    | 'ended'
    | 'cancelled';

export type CustomClauseStatus =
    | 'proposed'
    | 'accepted'
    | 'rejected'
    | 'countered';

export type AgreementPaymentStatus = 'pending' | 'completed' | 'failed' | 'waived';

export interface CommonTerms {
    rent: number;
    deposit: number;
    moveInDate: string;
    durationMonths: number;
    noticePeriodDays: number;
    paymentDueDay: number;
    utilities: string;
}

export interface ProposedCommonTerms {
    proposedBy: string;
    terms: CommonTerms;
    status: 'pending' | 'accepted' | 'rejected';
    proposedAt: string;
    respondedAt?: string | undefined;
}

export interface CustomClauseEntity {
    id: string;
    proposedBy: string;
    originalText: string;
    aiDraftText?: string | undefined;
    finalText: string;
    status: CustomClauseStatus;
    respondedBy?: string | undefined;
    respondedAt?: string | undefined;
    createdAt?: string | undefined;
}

export interface AgreementPayment {
    required: boolean;
    payerId?: string | undefined;
    amount: number;
    provider?: 'razorpay' | 'mock' | undefined;
    orderId?: string | undefined;
    paymentId?: string | undefined;
    status: AgreementPaymentStatus;
}

export interface EditLock {
    userId?: string | null | undefined;
    expiresAt?: string | null | undefined;
}

export interface AcceptanceTimestamps {
    host?: string | null | undefined;
    seeker?: string | null | undefined;
}

export interface AgreementEntity {
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
    startDate?: string | undefined;
    endDate?: string | undefined;
    activatedAt?: string | undefined;
    slotRestored?: boolean | undefined;
    terminatedAt?: string | undefined;
    version: number;
    lockedAt?: string | undefined;
    pdfUrl?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
