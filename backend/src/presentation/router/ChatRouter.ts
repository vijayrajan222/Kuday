import { Router } from "express";
import type { Request, Response } from "express";
import type { IChatController } from "@presentation/interface/IChatController";

export function createChatRouter(chatController: IChatController): Router {
    const router = Router();

    router.get("/conversations", async (req: Request, res: Response) => {
        return await chatController.getConversations(req, res);
    });

    router.post("/conversations", async (req: Request, res: Response) => {
        return await chatController.startConversation(req, res);
    });

    router.get("/conversations/:conversationId/messages", async (req: Request, res: Response) => {
        return await chatController.getMessages(req, res);
    });

    router.post("/messages", async (req: Request, res: Response) => {
        return await chatController.sendMessage(req, res);
    });

    router.patch("/conversations/:conversationId/read", async (req: Request, res: Response) => {
        return await chatController.markAsRead(req, res);
    });

    return router;
}
