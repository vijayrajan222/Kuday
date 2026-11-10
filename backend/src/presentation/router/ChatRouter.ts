import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import type { IChatController } from "@presentation/interface/IChatController";

export function createChatRouter(chatController: IChatController, authMiddleware?: RequestHandler): Router {
    const router = Router();

    // REST: GET /api/chat/:otherUserId/messages (auth required)
    const authHandlers: RequestHandler[] = authMiddleware ? [authMiddleware] : [];

    router.get("/unread-count", async (req: Request, res: Response) => {
        return await chatController.getUnreadCount(req, res);
    });

    router.get("/conversations", async (req: Request, res: Response) => {
        return await chatController.getConversations(req, res);
    });

    router.post("/conversations", async (req: Request, res: Response) => {
        return await chatController.startConversation(req, res);
    });

    router.get("/conversations/:conversationId/messages", async (req: Request, res: Response) => {
        return await chatController.getMessages(req, res);
    });

    router.get("/:otherUserId/messages", ...authHandlers, async (req: Request, res: Response) => {
        return await chatController.getMessagesByOtherUser(req, res);
    });

    router.post("/messages", async (req: Request, res: Response) => {
        return await chatController.sendMessage(req, res);
    });

    router.patch("/conversations/:conversationId/read", async (req: Request, res: Response) => {
        return await chatController.markAsRead(req, res);
    });

    return router;
}
