import type { Request, Response, NextFunction } from "express";
import type { IReportController } from "@presentation/interface/IReportController";
import type { ICreateReportUseCase } from "@application/interfaces/use-case/report/ICreateReportUseCase";
import type { IGetReportsUseCase } from "@application/interfaces/use-case/report/IGetReportsUseCase";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";
import { ApiResponse } from "@presentation/utils/ApiResponse";

export class ReportController implements IReportController {
    constructor(
        private readonly createReportUseCase: ICreateReportUseCase,
        private readonly getReportsUseCase: IGetReportsUseCase
    ) {}

    createReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const reporterId = (req as any).user?.id || req.body.reporterId;
            const { reportedUserId, reason, message, screenshotBase64, screenshotUrl } = req.body;

            const report = await this.createReportUseCase.execute({
                reporterId,
                reportedUserId,
                reason,
                message,
                screenshotBase64,
                screenshotUrl,
            });

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(
                    report,
                    "Report submitted successfully. Our safety and moderation team will review this promptly."
                )
            );
        } catch (error) {
            next(error);
        }
    };

    getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = req.query.status as string | undefined;
            const reportedUserId = req.query.reportedUserId as string | undefined;
            const reporterId = req.query.reporterId as string | undefined;

            const reports = await this.getReportsUseCase.execute({
                status,
                reportedUserId,
                reporterId,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(reports, "Reports retrieved successfully")
            );
        } catch (error) {
            next(error);
        }
    };
}
