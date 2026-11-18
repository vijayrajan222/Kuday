import type { ReportEntity, ReportStatus } from "@domain/entities/ReportEntity";

export interface IReportRepository {
    create(data: Omit<ReportEntity, "id">): Promise<ReportEntity>;
    findById(id: string): Promise<ReportEntity | null>;
    findAll(filter?: {
        status?: string | undefined;
        reportedUserId?: string | undefined;
        reporterId?: string | undefined;
    }): Promise<ReportEntity[]>;
    updateStatus(
        id: string,
        status: ReportStatus,
        adminNotes?: string
    ): Promise<ReportEntity | null>;
    issueWarning(
        id: string,
        warningMessage: string
    ): Promise<ReportEntity | null>;
}
