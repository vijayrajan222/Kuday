import type { Request, Response } from "express";

export interface IChatController {
    getConversations(req: Request, res: Response): Promise<void>;
    getMessages(req: Request, res: Response): Promise<void>;
    sendMessage(req: Request, res: Response): Promise<void>;
    startConversation(req: Request, res: Response): Promise<void>;
    markAsRead(req: Request, res: Response): Promise<void>;
    getUnreadCount(req: Request, res: Response): Promise<void>;
}
