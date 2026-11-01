import type { Request, Response } from "express";

export interface INotificationController {
    getNotifications(req: Request, res: Response): Promise<void>;
    createNotification(req: Request, res: Response): Promise<void>;
    markSingleAsRead(req: Request, res: Response): Promise<void>;
    markAllAsRead(req: Request, res: Response): Promise<void>;
}
