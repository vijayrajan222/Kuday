import type { Request, Response } from "express";
import type { ICreateLifestyleUseCase } from "../../application/interfaces/use-case/lifestyle/ICreateLifestyleUseCase.js";
import { CreateLifestyleSchema } from "../utils/validators/zod/CreateLifestyleSchema.js";

export class LifestyleController {
    constructor(private createLifestyleUseCase: ICreateLifestyleUseCase) {}

    async saveLifestyle(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = CreateLifestyleSchema.parse(req.body);

            const lifestyle = await this.createLifestyleUseCase.execute(validatedData);

            res.status(201).json({
                success: true,
                message: "Lifestyle preferences saved successfully",
                data: lifestyle
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || "Failed to save lifestyle preferences"
            });
        }
    }
}
