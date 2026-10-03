import { Router } from "express";
import type { SeekerPreferenceController } from "../controller/SeekerPreferenceController.js";

export const createSeekerPreferenceRouter = (
    seekerController: SeekerPreferenceController
): Router => {
    const router = Router();
    router.post("/", (req, res) => seekerController.createPreference(req, res));
    router.get("/", (req, res) => seekerController.getPreferences(req, res));
    return router;
};
