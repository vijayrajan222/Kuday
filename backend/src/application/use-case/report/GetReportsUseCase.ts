import type { IGetReportsUseCase } from "@application/interfaces/use-case/report/IGetReportsUseCase";
import type { IReportRepository } from "@application/interfaces/repository/IReportRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ReportResponseDto } from "@application/dto/report/ReportResponseDto";

export class GetReportsUseCase implements IGetReportsUseCase {
    constructor(
        private readonly reportRepository: IReportRepository,
        private readonly userRepository: IUserRepository
    ) {}

    async execute(filter?: {
        status?: string | undefined;
        reportedUserId?: string | undefined;
        reporterId?: string | undefined;
    }): Promise<ReportResponseDto[]> {
        const reports = await this.reportRepository.findAll(filter);

        const enrichedList: ReportResponseDto[] = [];
        for (const report of reports) {
            const [reporter, reportedUser] = await Promise.all([
                this.userRepository.findById(report.reporterId),
                this.userRepository.findById(report.reportedUserId),
            ]);

            enrichedList.push({
                id: report.id,
                reporterId: report.reporterId,
                reportedUserId: report.reportedUserId,
                reason: report.reason,
                message: report.message,
                screenshotUrl: report.screenshotUrl,
                status: report.status,
                adminNotes: report.adminNotes,
                warningIssued: report.warningIssued,
                warningMessage: report.warningMessage,
                warningIssuedAt: report.warningIssuedAt,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
                reporter: reporter
                    ? {
                          id: reporter.id,
                          firstName: reporter.firstName,
                          lastName: reporter.lastName || undefined,
                          email: reporter.email,
                          role: reporter.role || "none",
                          selfieUrl: reporter.selfieUrl || undefined,
                      }
                    : undefined,
                reportedUser: reportedUser
                    ? {
                          id: reportedUser.id,
                          firstName: reportedUser.firstName,
                          lastName: reportedUser.lastName || undefined,
                          email: reportedUser.email,
                          role: reportedUser.role || "none",
                          selfieUrl: reportedUser.selfieUrl || undefined,
                      }
                    : undefined,
            });
        }

        return enrichedList;
    }
}
