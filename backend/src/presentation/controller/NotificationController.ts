import type { Request, Response } from "express";
import type { IGetNotificationsUseCase } from "@application/interfaces/use-case/notification/IGetNotificationsUseCase.js";
import type { ICreateNotificationUseCase } from "@application/interfaces/use-case/notification/ICreateNotificationUseCase.js";
import type { IMarkNotificationReadUseCase } from "@application/interfaces/use-case/notification/IMarkNotificationReadUseCase.js";
import type { INotificationController } from "@presentation/interface/INotificationController.js";
import { ApiResponse } from "@presentation/utils/ApiResponse.js";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes.js";

export class NotificationController implements INotificationController {
    constructor(
        private getNotificationsUseCase: IGetNotificationsUseCase,
        private createNotificationUseCase: ICreateNotificationUseCase,
        private markNotificationReadUseCase: IMarkNotificationReadUseCase
    ) {}

    async getNotifications(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const notifications = await this.getNotificationsUseCase.execute(userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(notifications, "Notifications fetched successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch notifications")
            );
        }
    }

    async createNotification(req: Request, res: Response): Promise<void> {
        try {
            const { userId, title, message, type } = req.body;
            if (!userId || !title || !message) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("userId, title, and message are required")
                );
                return;
            }

            const notification = await this.createNotificationUseCase.execute({
                userId,
                title,
                message,
                type: type || "system",
            });

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(notification, "Notification created successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to create notification")
            );
        }
    }

    async markSingleAsRead(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const updated = await this.markNotificationReadUseCase.markSingle(id);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(updated, "Notification marked as read")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to mark notification as read")
            );
        }
    }

    async markAsRead(req: Request, res: Response): Promise<void> {
        return this.markSingleAsRead(req, res);
    }

    async markAllAsRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            await this.markNotificationReadUseCase.markAll(userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(null, "All notifications marked as read")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to mark all as read")
            );
        }
    }
}
