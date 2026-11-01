import { Router } from "express";
import type { ISeekerPreferenceController } from "../interface/ISeekerPreferenceController.js";

export function createSeekerPreferenceRouter(
    seekerController: ISeekerPreferenceController
): Router {
    const router = Router();
    router.post("/", (req, res) => seekerController.createPreference(req, res));
    router.get("/", (req, res) => seekerController.getPreferences(req, res));
    return router;
}
