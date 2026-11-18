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
  respondedAt?: string;
}

export interface CustomClause {
  id: string;
  proposedBy: string;
  originalText: string;
  aiDraftText?: string;
  finalText: string;
  status: CustomClauseStatus;
  respondedBy?: string;
  respondedAt?: string;
  createdAt?: string;
}

export interface AgreementPayment {
  required: boolean;
  payerId?: string;
  amount: number;
  provider?: 'razorpay' | 'mock';
  orderId?: string;
  paymentId?: string;
  status: AgreementPaymentStatus;
}

export interface PartySignature {
  signedAt?: string;
  ip?: string;
}

export interface AgreementSignatures {
  host?: PartySignature;
  seeker?: PartySignature;
}

export interface AgreementUserSummary {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  selfieUrl?: string;
  isPremium?: boolean;
}

export interface AgreementRoomSummary {
  id: string;
  title?: string;
  roomType: string;
  monthlyRent: number;
  location: string;
  images: string[];
}

export interface Agreement {
  id: string;
  hostId: string;
  seekerId: string;
  roomId: string;
  status: AgreementStatus;
  commonTerms: CommonTerms;
  pendingCommonTerms?: ProposedCommonTerms;
  hostObligations: string[];
  seekerObligations: string[];
  customClauses: CustomClause[];
  payment: AgreementPayment;
  signatures: AgreementSignatures;
  version: number;
  lockedAt?: string;
  pdfUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  host?: AgreementUserSummary;
  seeker?: AgreementUserSummary;
  room?: AgreementRoomSummary;
}

export interface AgreementUnlockStatus {
  unlocked: boolean;
  reason?: string;
  visitCompleted: boolean;
  callCompleted: boolean;
  activeAgreementId?: string;
}

export interface CreateAgreementPayload {
  hostId: string;
  seekerId: string;
  roomId: string;
}

export interface DraftClausePayload {
  userNeed: string;
}

export interface DraftClauseResponse {
  allowed: boolean;
  reason?: string;
  clauseText?: string;
  conflictsWithBaseTerms?: boolean;
  disclaimer: string;
}

export interface ProposeCustomClausePayload {
  originalText: string;
  aiDraftText?: string;
  finalText: string;
}

export interface RespondCustomClausePayload {
  action: 'accept' | 'reject' | 'counter';
  counterText?: string;
}

export interface AgreementPaymentOrderResponse {
  waived: boolean;
  waiverReason?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  provider?: 'razorpay' | 'mock';
  keyId?: string;
  agreement: Agreement;
}

export interface VerifyAgreementPaymentPayload {
  orderId: string;
  paymentId: string;
  signature?: string;
}
