import type { Request, Response } from "express";
import type { ICreateSeekerPreferenceUseCase } from "@application/interfaces/use-case/seeker/ICreateSeekerPreferenceUseCase";
import type { IGetSeekerPreferencesUseCase } from "@application/interfaces/use-case/seeker/IGetSeekerPreferencesUseCase";
import type { ISeekerPreferenceController } from "@presentation/interface/ISeekerPreferenceController";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export class SeekerPreferenceController implements ISeekerPreferenceController {
    constructor(
        private createSeekerPreferenceUseCase: ICreateSeekerPreferenceUseCase,
        private getSeekerPreferencesUseCase: IGetSeekerPreferencesUseCase
    ) {}

    async createPreference(req: Request, res: Response): Promise<void> {
        try {
            const preference = await this.createSeekerPreferenceUseCase.execute(req.body);
            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(preference, "Seeker preferences saved successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to save seeker preferences")
            );
        }
    }

    async getPreferences(req: Request, res: Response): Promise<void> {
        try {
            const hostUserId = (req.query.hostUserId || req.query.hostId || req.query.userId) as string | undefined;

            const preferences = await this.getSeekerPreferencesUseCase.execute(hostUserId);
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(preferences, "Seeker preferences fetched successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch seeker preferences")
            );
        }
    }
}
