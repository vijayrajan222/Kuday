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
  respondedAt?: string;
}

export interface CustomClause {
  id?: string;
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

export interface EditLock {
  userId?: string | null;
  expiresAt?: string | null;
}

export interface AcceptanceTimestamps {
  host?: string | null;
  seeker?: string | null;
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
  availableSlots?: number;
}

export interface Agreement {
  id: string;
  hostId: string;
  seekerId: string;
  roomId: string;
  status: AgreementStatus;
  startDate?: string;
  endDate?: string;
  activatedAt?: string;
  slotRestored?: boolean;
  terminatedAt?: string;
  commonTerms: CommonTerms;
  pendingCommonTerms?: ProposedCommonTerms;
  hostObligations: string[];
  seekerObligations: string[];
  customClauses: CustomClause[];
  editLock: EditLock;
  revision: number;
  pendingWith?: string | null;
  lastSubmittedBy?: string | null;
  acceptedBy: string[];
  acceptanceTimestamps: AcceptanceTimestamps;
  payment: AgreementPayment;
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
  visitCompleted?: boolean;
  callCompleted?: boolean;
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

export interface SubmitProposalPayload {
  revision: number;
  commonTerms?: CommonTerms;
  customClauses?: CustomClause[];
}

export interface AcceptProposalPayload {
  revision: number;
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

export interface ActiveRoommatePartner {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  occupation?: string;
  selfieUrl?: string;
  identityVerified: boolean;
}

export interface ActiveRoommateRoom {
  id: string;
  title?: string;
  roomType: string;
  monthlyRent: number;
  location: string;
  images: string[];
}

export interface ActiveRoommateResponse {
  agreementId: string;
  hostId?: string;
  seekerId?: string;
  userRole?: 'host' | 'seeker';
  startDate?: string;
  endDate?: string;
  status: string;
  commonTerms: {
    rent: number;
    deposit: number;
    moveInDate: string;
    durationMonths: number;
    utilities: string;
  };
  partner: ActiveRoommatePartner;
  room: ActiveRoommateRoom;
}
