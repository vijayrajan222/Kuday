import type { CreateReportDto } from "@application/dto/report/CreateReportDto";
import type { ReportResponseDto } from "@application/dto/report/ReportResponseDto";

export interface ICreateReportUseCase {
    execute(dto: CreateReportDto): Promise<ReportResponseDto>;
}
