import { Router } from "express";
import type { Request, Response } from "express";
import type { ILifestyleController } from "@presentation/interface/ILifestyleController";

export function createLifestyleRouter(lifestyleController: ILifestyleController): Router {
    const router = Router();

    router.post("/", async (req: Request, res: Response) => {
        return await lifestyleController.saveLifestyle(req, res);
    });

    router.get("/:userId", async (req: Request, res: Response) => {
        return await lifestyleController.getLifestyle(req, res);
    });

    return router;
}
