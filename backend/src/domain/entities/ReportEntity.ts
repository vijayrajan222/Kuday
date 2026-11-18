export type ReportReason =
    | "harassment"
    | "fake_profile_or_listing"
    | "scam_fraud"
    | "inappropriate_behavior"
    | "spam"
    | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface ReportEntity {
    id: string;
    reporterId: string;
    reportedUserId: string;
    reason: ReportReason | string;
    message: string;
    screenshotUrl?: string | undefined;
    status: ReportStatus;
    adminNotes?: string | undefined;
    warningIssued?: boolean | undefined;
    warningMessage?: string | undefined;
    warningIssuedAt?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
