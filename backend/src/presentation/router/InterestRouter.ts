import { Router } from "express";
import type { Request, Response } from "express";
import type { IInterestController } from "@presentation/interface/IInterestController";

export function createInterestRouter(
    interestController: IInterestController
): Router {
    const router = Router();

    router.post("/", async (req: Request, res: Response) => {
        return await interestController.sendInterest(req, res);
    });

    router.patch("/:id/status", async (req: Request, res: Response) => {
        return await interestController.updateStatus(req, res);
    });

    router.get("/received/:userId", async (req: Request, res: Response) => {
        return await interestController.getReceivedInterests(req, res);
    });

    router.get("/sent/:userId", async (req: Request, res: Response) => {
        return await interestController.getSentInterests(req, res);
    });

    return router;
}
