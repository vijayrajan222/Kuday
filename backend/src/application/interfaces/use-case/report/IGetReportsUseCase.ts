import type { ReportResponseDto } from "@application/dto/report/ReportResponseDto";

export interface IGetReportsUseCase {
    execute(filter?: {
        status?: string | undefined;
        reportedUserId?: string | undefined;
        reporterId?: string | undefined;
    }): Promise<ReportResponseDto[]>;
}
