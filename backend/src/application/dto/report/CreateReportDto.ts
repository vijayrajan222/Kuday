export interface CreateReportDto {
    reporterId: string;
    reportedUserId: string;
    reason: string;
    message: string;
    screenshotBase64?: string | undefined;
    screenshotUrl?: string | undefined;
}
