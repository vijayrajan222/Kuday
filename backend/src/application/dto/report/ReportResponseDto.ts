import type { ReportStatus } from "@domain/entities/ReportEntity";

export interface ReportUserSummaryDto {
    id: string;
    firstName: string;
    lastName?: string | undefined;
    email: string;
    role: string;
    selfieUrl?: string | undefined;
}

export interface ReportResponseDto {
    id: string;
    reporterId: string;
    reportedUserId: string;
    reporter?: ReportUserSummaryDto | undefined;
    reportedUser?: ReportUserSummaryDto | undefined;
    reason: string;
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
