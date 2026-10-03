import type { Request, Response } from "express";
import type { ICreateLifestyleUseCase } from "../../application/interfaces/use-case/lifestyle/ICreateLifestyleUseCase.js";
import type { IGetLifestyleUseCase } from "../../application/interfaces/use-case/lifestyle/IGetLifestyleUseCase.js";
import { CreateLifestyleSchema } from "../utils/validators/zod/CreateLifestyleSchema.js";

export class LifestyleController {
    constructor(
        private createLifestyleUseCase: ICreateLifestyleUseCase,
        private getLifestyleUseCase: IGetLifestyleUseCase
    ) {}

    async saveLifestyle(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = CreateLifestyleSchema.parse(req.body);
            const lifestyle = await this.createLifestyleUseCase.execute(validatedData);

            res.status(201).json({
                success: true,
                message: "Lifestyle preferences saved successfully",
                data: lifestyle,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to save lifestyle preferences",
            });
        }
    }

    async getLifestyle(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const lifestyle = await this.getLifestyleUseCase.execute(userId);

            res.status(200).json({
                success: true,
                data: lifestyle,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to fetch lifestyle preferences",
            });
        }
    }
}
