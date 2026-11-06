import { Router } from "express";
import type { Request, Response } from "express";
import type { ISeekerPreferenceController } from "@presentation/interface/ISeekerPreferenceController";

export function createSeekerPreferenceRouter(
    seekerController: ISeekerPreferenceController
): Router {
    const router = Router();

    router.post("/", async (req: Request, res: Response) => {
        return await seekerController.createPreference(req, res);
    });

    router.get("/", async (req: Request, res: Response) => {
        return await seekerController.getPreferences(req, res);
    });

    return router;
}
