import type { Request, Response } from "express";
import type { IGetNotificationsUseCase } from "../../application/interfaces/use-case/notification/IGetNotificationsUseCase.js";
import type { ICreateNotificationUseCase } from "../../application/interfaces/use-case/notification/ICreateNotificationUseCase.js";
import type { IMarkNotificationReadUseCase } from "../../application/interfaces/use-case/notification/IMarkNotificationReadUseCase.js";

export class NotificationController {
    constructor(
        private getNotificationsUseCase: IGetNotificationsUseCase,
        private createNotificationUseCase: ICreateNotificationUseCase,
        private markNotificationReadUseCase: IMarkNotificationReadUseCase
    ) {}

    async getNotifications(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const notifications = await this.getNotificationsUseCase.execute(userId);
            res.status(200).json({
                success: true,
                data: notifications,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to fetch notifications",
            });
        }
    }

    async createNotification(req: Request, res: Response): Promise<void> {
        try {
            const { userId, title, message, type } = req.body;
            if (!userId || !title || !message) {
                res.status(400).json({
                    success: false,
                    message: "userId, title, and message are required",
                });
                return;
            }

            const notification = await this.createNotificationUseCase.execute({
                userId,
                title,
                message,
                type: type || "system",
            });

            res.status(201).json({
                success: true,
                data: notification,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create notification",
            });
        }
    }

    async markSingleAsRead(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const updated = await this.markNotificationReadUseCase.markSingle(id);
            res.status(200).json({
                success: true,
                data: updated,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to mark notification as read",
            });
        }
    }

    async markAllAsRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            await this.markNotificationReadUseCase.markAll(userId);
            res.status(200).json({
                success: true,
                message: "All notifications marked as read",
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to mark all as read",
            });
        }
    }
}
