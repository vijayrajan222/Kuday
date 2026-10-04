import type { Request, Response } from "express";
import type { ICreateSeekerPreferenceUseCase } from "../../application/interfaces/use-case/seeker/ICreateSeekerPreferenceUseCase.js";
import type { GetSeekerPreferencesUseCase } from "../../application/use-case/seeker/GetSeekerPreferencesUseCase.js";

export class SeekerPreferenceController {
    constructor(
        private createSeekerPreferenceUseCase: ICreateSeekerPreferenceUseCase,
        private getSeekerPreferencesUseCase: GetSeekerPreferencesUseCase
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
            const hostUserId = (req.query.hostUserId || req.query.hostId || req.query.userId) as string | undefined;

            const preferences = await this.getSeekerPreferencesUseCase.execute(hostUserId);
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
