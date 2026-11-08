import type { Request, Response } from "express";
import type { ISendInterestUseCase } from "@application/interfaces/use-case/interest/ISendInterestUseCase";
import type { IUpdateInterestStatusUseCase } from "@application/interfaces/use-case/interest/IUpdateInterestStatusUseCase";
import type { IGetReceivedInterestsUseCase } from "@application/interfaces/use-case/interest/IGetReceivedInterestsUseCase";
import type { IGetSentInterestsUseCase } from "@application/interfaces/use-case/interest/IGetSentInterestsUseCase";
import type { IInterestController } from "@presentation/interface/IInterestController";
import { SendInterestSchema, UpdateInterestStatusSchema } from "@presentation/utils/validators/zod/InterestSchema";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";
import { ApplicationError } from "@application/errors/AppError";

export class InterestController implements IInterestController {
    constructor(
        private readonly sendInterestUseCase: ISendInterestUseCase,
        private readonly updateInterestStatusUseCase: IUpdateInterestStatusUseCase,
        private readonly getReceivedInterestsUseCase: IGetReceivedInterestsUseCase,
        private readonly getSentInterestsUseCase: IGetSentInterestsUseCase
    ) {}

    async sendInterest(req: Request, res: Response): Promise<void> {
        try {
            const parsed = SendInterestSchema.parse(req.body);
            const result = await this.sendInterestUseCase.execute(parsed);

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(result, "Interest request sent successfully")
            );
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                res.status(error.statusCode).json(ApiResponse.error(error.message, error.statusCode));
                return;
            }
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to send interest request")
            );
        }
    }

    async updateStatus(req: Request, res: Response): Promise<void> {
        try {
            const interestId = req.params.id as string;
            const parsed = UpdateInterestStatusSchema.parse(req.body);

            const result = await this.updateInterestStatusUseCase.execute({
                interestId,
                userId: parsed.userId,
                status: parsed.status,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, `Interest request marked as ${parsed.status}`)
            );
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                res.status(error.statusCode).json(ApiResponse.error(error.message, error.statusCode));
                return;
            }
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to update interest request")
            );
        }
    }

    async getReceivedInterests(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const results = await this.getReceivedInterestsUseCase.execute(userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(results, "Received interest requests fetched successfully")
            );
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                res.status(error.statusCode).json(ApiResponse.error(error.message, error.statusCode));
                return;
            }
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch received interests")
            );
        }
    }

    async getSentInterests(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const results = await this.getSentInterestsUseCase.execute(userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(results, "Sent interest requests fetched successfully")
            );
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                res.status(error.statusCode).json(ApiResponse.error(error.message, error.statusCode));
                return;
            }
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch sent interests")
            );
        }
    }
}
