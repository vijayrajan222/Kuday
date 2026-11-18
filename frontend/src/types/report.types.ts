export type ReportReason =
  | 'harassment'
  | 'fake_profile_or_listing'
  | 'scam_fraud'
  | 'inappropriate_behavior'
  | 'spam'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface CreateReportPayload {
  reporterId?: string;
  reportedUserId: string;
  reason: ReportReason | string;
  message: string;
  screenshotBase64?: string;
  screenshotUrl?: string;
}

export interface ReportUserSummary {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  selfieUrl?: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reporter?: ReportUserSummary;
  reportedUser?: ReportUserSummary;
  reason: string;
  message: string;
  screenshotUrl?: string;
  status: ReportStatus;
  adminNotes?: string;
  warningIssued?: boolean;
  warningMessage?: string;
  warningIssuedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  data: ReportItem;
}

export interface ReportsListResponse {
  success: boolean;
  message?: string;
  data: ReportItem[];
}
