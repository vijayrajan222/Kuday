import type { Request, Response } from "express";
import type { IAdminLoginUseCase } from "@application/interfaces/use-case/admin/IAdminLoginUseCase";
import type { IGetAdminStatsUseCase } from "@application/interfaces/use-case/admin/IGetAdminStatsUseCase";
import type { IGetAllUsersUseCase } from "@application/interfaces/use-case/admin/IGetAllUsersUseCase";
import type { IVerifyUserIdentityUseCase } from "@application/interfaces/use-case/admin/IVerifyUserIdentityUseCase";
import type { IToggleBlockUserUseCase } from "@application/interfaces/use-case/admin/IToggleBlockUserUseCase";
import type { IGetAdminRevenueUseCase } from "@application/interfaces/use-case/admin/IGetAdminRevenueUseCase";
import type { IGetReportsUseCase } from "@application/interfaces/use-case/report/IGetReportsUseCase";
import type { IReportRepository } from "@application/interfaces/repository/IReportRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { ReportStatus } from "@domain/entities/ReportEntity";
import type { IAdminController } from "@presentation/interface/IAdminController";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export class AdminController implements IAdminController {
    constructor(
        private adminLoginUseCase: IAdminLoginUseCase,
        private getAdminStatsUseCase: IGetAdminStatsUseCase,
        private getAllUsersUseCase: IGetAllUsersUseCase,
        private verifyUserIdentityUseCase: IVerifyUserIdentityUseCase,
        private toggleBlockUserUseCase: IToggleBlockUserUseCase,
        private getAdminRevenueUseCase?: IGetAdminRevenueUseCase,
        private getReportsUseCase?: IGetReportsUseCase,
        private reportRepository?: IReportRepository,
        private notificationRepository?: INotificationRepository,
        private socketService?: ISocketNotificationService
    ) {}

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("Email and password are required.")
                );
                return;
            }
            const result = await this.adminLoginUseCase.execute({ email, password });
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Admin login successful")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Admin login failed.";
            res.status(HttpStatusCodes.UNAUTHORIZED).json(
                ApiResponse.error(msg, HttpStatusCodes.UNAUTHORIZED)
            );
        }
    }

    async getStats(_req: Request, res: Response): Promise<void> {
        try {
            const stats = await this.getAdminStatsUseCase.execute();
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(stats, "Admin stats fetched successfully")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch admin stats.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const users = await this.getAllUsersUseCase.execute(search);
            const mappedUsers = users.map((u) => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                role: u.role || "seeker",
                identityVerified: Boolean(u.identityVerified),
                identityStatus: u.identityStatus || "none",
                rejectionReason: u.rejectionReason,
                selfieUrl: u.selfieUrl,
                idCardUrl: u.idCardUrl,
                isBlocked: Boolean(u.isBlocked),
                isAdmin: Boolean(u.isAdmin),
            }));
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(mappedUsers, "Users fetched successfully")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch users.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async verifyIdentity(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const { action, rejectionReason } = req.body;
            if (!action || (action !== "approve" && action !== "reject")) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("Action must be 'approve' or 'reject'.")
                );
                return;
            }
            const result = await this.verifyUserIdentityUseCase.execute({ userId, action, rejectionReason });
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Identity verification updated successfully")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to verify user identity.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async toggleBlock(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const result = await this.toggleBlockUserUseCase.execute(userId);
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to toggle block status.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async getRevenue(_req: Request, res: Response): Promise<void> {
        try {
            if (!this.getAdminRevenueUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Revenue analytics not enabled.")
                );
                return;
            }
            const data = await this.getAdminRevenueUseCase.execute();
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(data, "Admin revenue data fetched successfully")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch revenue data.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async getReports(req: Request, res: Response): Promise<void> {
        try {
            if (!this.getReportsUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Report management not enabled.")
                );
                return;
            }
            const status = req.query.status as string | undefined;
            const reportedUserId = req.query.reportedUserId as string | undefined;
            const reporterId = req.query.reporterId as string | undefined;

            const reports = await this.getReportsUseCase.execute({
                status: status || undefined,
                reportedUserId: reportedUserId || undefined,
                reporterId: reporterId || undefined,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(reports, "Admin reports fetched successfully")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch reports.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async updateReportStatus(req: Request, res: Response): Promise<void> {
        try {
            if (!this.reportRepository) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Report repository not initialized.")
                );
                return;
            }
            const reportId = req.params.reportId as string;
            const { status, adminNotes, reporterMessage, notifyReporter } = req.body;

            if (!status || !["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("Valid status (pending, reviewed, resolved, dismissed) is required.")
                );
                return;
            }

            const existingReport = await this.reportRepository.findById(reportId);
            if (!existingReport) {
                res.status(HttpStatusCodes.NOT_FOUND).json(
                    ApiResponse.error("Report not found.")
                );
                return;
            }

            const updated = await this.reportRepository.updateStatus(
                reportId,
                status as ReportStatus,
                adminNotes
            );

            // Notify reporter when report is reviewed or resolved, or if explicitly requested
            const shouldNotify = notifyReporter !== false && (status === "reviewed" || status === "resolved");
            if (shouldNotify && this.notificationRepository && existingReport.reporterId) {
                try {
                    const messageText = typeof reporterMessage === "string" && reporterMessage.trim().length > 0
                        ? reporterMessage.trim()
                        : "Your report has been reviewed and necessary action will be taken. Thank you for helping keep Kuday safe.";

                    const notification = await this.notificationRepository.create({
                        userId: existingReport.reporterId,
                        title: "Report Reviewed - Safety Team",
                        message: messageText,
                        type: "system",
                        isRead: false,
                    });

                    if (this.socketService) {
                        this.socketService.notifyUser(existingReport.reporterId, "new_notification", notification);
                    }
                } catch (notifErr) {
                    console.error("Failed to deliver notification to reporter:", notifErr);
                }
            }

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(updated, `Report marked as ${status}`)
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update report status.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async warnReportedUser(req: Request, res: Response): Promise<void> {
        try {
            if (!this.reportRepository) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Report repository not initialized.")
                );
                return;
            }

            const reportId = req.params.reportId as string;
            const { warningMessage } = req.body;

            const report = await this.reportRepository.findById(reportId);
            if (!report) {
                res.status(HttpStatusCodes.NOT_FOUND).json(
                    ApiResponse.error("Report not found.")
                );
                return;
            }

            const finalWarning = typeof warningMessage === "string" && warningMessage.trim().length > 0
                ? warningMessage.trim()
                : `Official Safety Warning: Your account has received an incident report regarding "${report.reason}". Please strictly adhere to community guidelines and respectful conduct. Continued violations may result in account suspension or termination.`;

            // Deliver official warning notification to reported user
            if (this.notificationRepository && report.reportedUserId) {
                try {
                    const notification = await this.notificationRepository.create({
                        userId: report.reportedUserId,
                        title: "Official Safety Warning from Kuday Moderation",
                        message: finalWarning,
                        type: "system",
                        isRead: false,
                    });

                    if (this.socketService) {
                        this.socketService.notifyUser(report.reportedUserId, "new_notification", notification);
                    }
                } catch (notifErr) {
                    console.error("Failed to deliver warning notification to reported user:", notifErr);
                }
            }

            const updatedReport = await this.reportRepository.issueWarning(reportId, finalWarning);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(updatedReport, "Official warning issued to reported user successfully.")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to issue warning to user.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
