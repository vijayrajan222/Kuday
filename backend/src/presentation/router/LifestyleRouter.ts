import { Router } from "express";
import type { LifestyleController } from "../controller/LifestyleController.js";

export const createLifestyleRouter = (lifestyleController: LifestyleController): Router => {
    const router = Router();
    router.post("/", (req, res) => lifestyleController.saveLifestyle(req, res));
    return router;
};
