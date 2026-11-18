import type { ICreateReportUseCase } from "@application/interfaces/use-case/report/ICreateReportUseCase";
import type { IReportRepository } from "@application/interfaces/repository/IReportRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ICloudinaryService } from "@application/interfaces/services/ICloudinaryService";
import type { CreateReportDto } from "@application/dto/report/CreateReportDto";
import type { ReportResponseDto } from "@application/dto/report/ReportResponseDto";

export class CreateReportUseCase implements ICreateReportUseCase {
    constructor(
        private readonly reportRepository: IReportRepository,
        private readonly userRepository: IUserRepository,
        private readonly cloudinaryService: ICloudinaryService
    ) {}

    async execute(dto: CreateReportDto): Promise<ReportResponseDto> {
        const { reporterId, reportedUserId, reason, message, screenshotBase64, screenshotUrl } = dto;

        if (!reporterId || !reporterId.trim()) {
            throw new Error("Reporter user ID is required");
        }
        if (!reportedUserId || !reportedUserId.trim()) {
            throw new Error("Target reported user ID is required");
        }
        if (reporterId.trim() === reportedUserId.trim()) {
            throw new Error("You cannot file a report against yourself");
        }
        if (!reason || !reason.trim()) {
            throw new Error("A valid reason for reporting must be selected");
        }
        if (!message || message.trim().length < 3) {
            throw new Error("Please provide an explanation or message for reporting (at least 3 characters)");
        }

        // Validate both users exist
        const [reporter, reportedUser] = await Promise.all([
            this.userRepository.findById(reporterId.trim()),
            this.userRepository.findById(reportedUserId.trim()),
        ]);

        if (!reporter) {
            throw new Error("Reporter account could not be found");
        }
        if (!reportedUser) {
            throw new Error("The user you are attempting to report does not exist");
        }

        // Upload screenshot proof to Cloudinary if provided
        let finalScreenshotUrl = screenshotUrl ? screenshotUrl.trim() : undefined;
        if (screenshotBase64 && screenshotBase64.trim().length > 0) {
            try {
                finalScreenshotUrl = await this.cloudinaryService.uploadImage(
                    screenshotBase64,
                    "kuday_reports"
                );
            } catch (err) {
                console.error("Failed to upload report proof screenshot:", err);
                throw new Error("Failed to upload screenshot proof. Please try again with a valid image.");
            }
        }

        const newReport = await this.reportRepository.create({
            reporterId: reporter.id,
            reportedUserId: reportedUser.id,
            reason: reason.trim(),
            message: message.trim(),
            screenshotUrl: finalScreenshotUrl,
            status: "pending",
        });

        return {
            id: newReport.id,
            reporterId: newReport.reporterId,
            reportedUserId: newReport.reportedUserId,
            reason: newReport.reason,
            message: newReport.message,
            screenshotUrl: newReport.screenshotUrl,
            status: newReport.status,
            adminNotes: newReport.adminNotes,
            createdAt: newReport.createdAt,
            updatedAt: newReport.updatedAt,
            reporter: {
                id: reporter.id,
                firstName: reporter.firstName,
                lastName: reporter.lastName || undefined,
                email: reporter.email,
                role: reporter.role || "none",
                selfieUrl: reporter.selfieUrl || undefined,
            },
            reportedUser: {
                id: reportedUser.id,
                firstName: reportedUser.firstName,
                lastName: reportedUser.lastName || undefined,
                email: reportedUser.email,
                role: reportedUser.role || "none",
                selfieUrl: reportedUser.selfieUrl || undefined,
            },
        };
    }
}
