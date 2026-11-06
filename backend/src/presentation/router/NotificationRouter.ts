import { Router } from "express";
import type { Request, Response } from "express";
import type { INotificationController } from "@presentation/interface/INotificationController.js";

export function createNotificationRouter(
    notificationController: INotificationController
): Router {
    const router = Router();

    router.get("/:userId", async (req: Request, res: Response) => {
        return await notificationController.getNotifications(req, res);
    });

    router.post("/", async (req: Request, res: Response) => {
        return await notificationController.createNotification(req, res);
    });

    router.patch("/:id/read", async (req: Request, res: Response) => {
        return await notificationController.markSingleAsRead(req, res);
    });

    router.patch("/:userId/read-all", async (req: Request, res: Response) => {
        return await notificationController.markAllAsRead(req, res);
    });

    return router;
}
