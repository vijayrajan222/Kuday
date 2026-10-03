import type { Request, Response } from "express";
import type { ICreateSeekerPreferenceUseCase } from "../../application/interfaces/use-case/seeker/ICreateSeekerPreferenceUseCase.js";
import type { IGetSeekerPreferencesUseCase } from "../../application/interfaces/use-case/seeker/IGetSeekerPreferencesUseCase.js";

export class SeekerPreferenceController {
    constructor(
        private createSeekerPreferenceUseCase: ICreateSeekerPreferenceUseCase,
        private getSeekerPreferencesUseCase: IGetSeekerPreferencesUseCase
    ) {}

    async createPreference(req: Request, res: Response): Promise<void> {
        try {
            const preference = await this.createSeekerPreferenceUseCase.execute(req.body);
            res.status(201).json({
                success: true,
                message: "Seeker preferences saved successfully",
                data: preference,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to save seeker preferences",
            });
        }
    }

    async getPreferences(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.query.userId as string | undefined;
            if (userId) {
                const preference = await this.getSeekerPreferencesUseCase.getByUserId(userId);
                res.status(200).json({
                    success: true,
                    data: preference,
                });
                return;
            }

            const preferences = await this.getSeekerPreferencesUseCase.execute();
            res.status(200).json({
                success: true,
                data: preferences,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to fetch seeker preferences",
            });
        }
    }
}
