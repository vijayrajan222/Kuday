import { Router } from "express";
import type { ILifestyleController } from "../interface/ILifestyleController.js";

export function createLifestyleRouter(lifestyleController: ILifestyleController): Router {
    const router = Router();
    router.post("/", (req, res) => lifestyleController.saveLifestyle(req, res));
    router.get("/:userId", (req, res) => lifestyleController.getLifestyle(req, res));
    return router;
}
