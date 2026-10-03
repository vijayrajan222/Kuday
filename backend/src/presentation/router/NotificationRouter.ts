import { Router } from "express";
import type { NotificationController } from "../controller/NotificationController.js";

export const createNotificationRouter = (
    notificationController: NotificationController
): Router => {
    const router = Router();

    router.get("/:userId", (req, res) => notificationController.getNotifications(req, res));
    router.post("/", (req, res) => notificationController.createNotification(req, res));
    router.patch("/:id/read", (req, res) => notificationController.markSingleAsRead(req, res));
    router.patch("/:userId/read-all", (req, res) => notificationController.markAllAsRead(req, res));

    return router;
};
