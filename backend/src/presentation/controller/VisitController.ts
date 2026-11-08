import type { Request, Response, NextFunction } from "express";
import type { IVisitController } from "@presentation/interface/IVisitController";
import type { ICreateVisitUseCase } from "@application/interfaces/use-case/visit/ICreateVisitUseCase";
import type { IGetVisitsUseCase } from "@application/interfaces/use-case/visit/IGetVisitsUseCase";
import type { IUpdateVisitStatusUseCase } from "@application/interfaces/use-case/visit/IUpdateVisitStatusUseCase";
import type { ISuggestVisitUseCase } from "@application/interfaces/use-case/visit/ISuggestVisitUseCase";
import {
    createVisitSchema,
    updateVisitStatusSchema,
    suggestVisitSchema,
} from "@presentation/utils/validators/zod/VisitSchema";

export class VisitController implements IVisitController {
    constructor(
        private readonly createVisitUseCase: ICreateVisitUseCase,
        private readonly getVisitsUseCase: IGetVisitsUseCase,
        private readonly updateVisitStatusUseCase: IUpdateVisitStatusUseCase,
        private readonly suggestVisitUseCase: ISuggestVisitUseCase
    ) {}

    createVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validated = createVisitSchema.parse(req.body);
            const visit = await this.createVisitUseCase.execute(validated);
            res.status(201).json({
                success: true,
                message: "Visit request submitted successfully.",
                data: visit,
            });
        } catch (error) {
            next(error);
        }
    };

    getVisitsByConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const connectionId = String(req.params.connectionId || "");
            const visits = await this.getVisitsUseCase.getByConnectionId(connectionId);
            res.status(200).json({
                success: true,
                data: visits,
            });
        } catch (error) {
            next(error);
        }
    };

    getVisitsByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = String(req.params.userId || "");
            const visits = await this.getVisitsUseCase.getByUserId(userId);
            res.status(200).json({
                success: true,
                data: visits,
            });
        } catch (error) {
            next(error);
        }
    };

    updateVisitStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const visitId = String(req.params.visitId || "");
            const userId = String(req.body.userId || req.headers["x-user-id"] || "");
            const validated = updateVisitStatusSchema.parse(req.body);

            const updated = await this.updateVisitStatusUseCase.execute({
                visitId,
                userId,
                status: validated.status,
                note: validated.note,
            });

            res.status(200).json({
                success: true,
                message: `Visit marked as ${validated.status}.`,
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    suggestVisitChanges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const visitId = String(req.params.visitId || "");
            const userId = String(req.body.userId || req.headers["x-user-id"] || "");
            const validated = suggestVisitSchema.parse(req.body);

            const updated = await this.suggestVisitUseCase.execute({
                visitId,
                userId,
                suggestedDate: validated.suggestedDate,
                suggestedTimeSlot: validated.suggestedTimeSlot,
                suggestedSlotTime: validated.suggestedSlotTime,
                suggestedMessage: validated.suggestedMessage,
            });

            res.status(200).json({
                success: true,
                message: "Proposed reschedule sent successfully.",
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    acceptVisitSuggestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const visitId = String(req.params.visitId || "");
            const userId = String(req.body.userId || req.headers["x-user-id"] || "");

            const updated = await this.updateVisitStatusUseCase.acceptSuggestion(visitId, userId);

            res.status(200).json({
                success: true,
                message: "Rescheduled visit confirmed.",
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };
}
