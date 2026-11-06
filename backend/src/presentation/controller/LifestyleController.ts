import type { Request, Response } from "express";
import type { ICreateLifestyleUseCase } from "@application/interfaces/use-case/lifestyle/ICreateLifestyleUseCase";
import type { IGetLifestyleUseCase } from "@application/interfaces/use-case/lifestyle/IGetLifestyleUseCase";
import type { ILifestyleController } from "@presentation/interface/ILifestyleController";
import { CreateLifestyleSchema } from "@presentation/utils/validators/zod/CreateLifestyleSchema";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export class LifestyleController implements ILifestyleController {
    constructor(
        private createLifestyleUseCase: ICreateLifestyleUseCase,
        private getLifestyleUseCase: IGetLifestyleUseCase
    ) {}

    async saveLifestyle(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = CreateLifestyleSchema.parse(req.body);
            const lifestyle = await this.createLifestyleUseCase.execute(validatedData);

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(lifestyle, "Lifestyle preferences saved successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to save lifestyle preferences")
            );
        }
    }

    async getLifestyle(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const lifestyle = await this.getLifestyleUseCase.execute(userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(lifestyle, "Lifestyle preferences fetched successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch lifestyle preferences")
            );
        }
    }
}
