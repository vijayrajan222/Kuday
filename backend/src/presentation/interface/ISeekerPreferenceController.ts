import type { Request, Response } from "express";

export interface ISeekerPreferenceController {
    createPreference(req: Request, res: Response): Promise<void>;
    getPreferences(req: Request, res: Response): Promise<void>;
}
