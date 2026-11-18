export type AgreementStatus =
    | 'draft'
    | 'negotiating'
    | 'awaiting_payment'
    | 'ready_to_sign'
    | 'signed'
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

export interface PartySignature {
    signedAt?: string | undefined;
    ip?: string | undefined;
}

export interface AgreementSignatures {
    host?: PartySignature | undefined;
    seeker?: PartySignature | undefined;
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
    payment: AgreementPayment;
    signatures: AgreementSignatures;
    version: number;
    lockedAt?: string | undefined;
    pdfUrl?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
