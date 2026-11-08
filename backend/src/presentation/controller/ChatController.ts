import type { Request, Response } from "express";
import type { IChatController } from "@presentation/interface/IChatController";
import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { IGetMessagesUseCase } from "@application/interfaces/use-case/chat/IGetMessagesUseCase";
import type { IGetConversationsUseCase } from "@application/interfaces/use-case/chat/IGetConversationsUseCase";
import type { IMarkMessagesAsReadUseCase } from "@application/interfaces/use-case/chat/IMarkMessagesAsReadUseCase";
import type { IStartConversationUseCase } from "@application/interfaces/use-case/chat/IStartConversationUseCase";
import type { IGetUnreadCountUseCase } from "@application/interfaces/use-case/chat/IGetUnreadCountUseCase";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";
import type { SocketService } from "@infrastructure/socket/SocketService";

export class ChatController implements IChatController {
    constructor(
        private sendMessageUseCase: ISendMessageUseCase,
        private getMessagesUseCase: IGetMessagesUseCase,
        private getConversationsUseCase: IGetConversationsUseCase,
        private markMessagesAsReadUseCase: IMarkMessagesAsReadUseCase,
        private startConversationUseCase: IStartConversationUseCase,
        private getUnreadCountUseCase: IGetUnreadCountUseCase,
        private socketService?: SocketService
    ) {}

    async getConversations(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
            if (!userId) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("userId query parameter or header is required", HttpStatusCodes.BAD_REQUEST)
                );
                return;
            }

            const conversations = await this.getConversationsUseCase.execute(userId);

            // Enrich with online status
            const enriched = conversations.map((conv) => {
                const other = conv.participantDetails?.find((p) => p.id !== userId);
                const isOnline = other ? this.socketService?.isUserOnline(other.id) ?? false : false;
                return {
                    ...conv,
                    isOnline,
                };
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(enriched, "Conversations fetched successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch conversations")
            );
        }
    }

    async getMessages(req: Request, res: Response): Promise<void> {
        try {
            const conversationId = req.params.conversationId as string;
            const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const before = req.query.before as string | undefined;

            if (!conversationId || !userId) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("conversationId and userId are required", HttpStatusCodes.BAD_REQUEST)
                );
                return;
            }

            const messages = await this.getMessagesUseCase.execute(conversationId, userId, limit, before);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(messages, "Messages fetched successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch messages")
            );
        }
    }

    async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const { senderId, receiverId, content, conversationId } = req.body;

            if (!senderId || !receiverId || !content) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("senderId, receiverId, and content are required", HttpStatusCodes.BAD_REQUEST)
                );
                return;
            }

            const result = await this.sendMessageUseCase.execute({
                senderId,
                receiverId,
                content,
                conversationId,
            });

            // Also emit via Socket.io if active
            if (this.socketService) {
                const io = this.socketService.getIo();
                if (io) {
                    io.to(`conv_${result.conversation.id}`).emit("new_message", result.message);
                }
                this.socketService.notifyUser(receiverId, "message_notification", {
                    message: result.message,
                    conversation: result.conversation,
                    senderName: result.senderName,
                });
                if (result.notification) {
                    this.socketService.notifyUser(receiverId, "new_notification", result.notification);
                }
            }

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(result, "Message sent successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to send message")
            );
        }
    }

    async startConversation(req: Request, res: Response): Promise<void> {
        try {
            const { userId, recipientId } = req.body;

            if (!userId || !recipientId) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("userId and recipientId are required", HttpStatusCodes.BAD_REQUEST)
                );
                return;
            }

            const conversation = await this.startConversationUseCase.execute(userId, recipientId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(conversation, "Conversation ready")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to start conversation")
            );
        }
    }

    async markAsRead(req: Request, res: Response): Promise<void> {
        try {
            const conversationId = req.params.conversationId as string;
            const { userId } = req.body;

            if (!conversationId || !userId) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("conversationId and userId are required", HttpStatusCodes.BAD_REQUEST)
                );
                return;
            }

            await this.markMessagesAsReadUseCase.execute(conversationId, userId);

            const io = this.socketService?.getIo();
            if (io) {
                io.to(`conv_${conversationId}`).emit("messages_read", { conversationId, readBy: userId });
            }

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(null, "Messages marked as read")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to mark messages as read")
            );
        }
    }

    async getUnreadCount(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
            if (!userId) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("userId query parameter or header is required", HttpStatusCodes.BAD_REQUEST)
                );
                return;
            }

            const unreadCount = await this.getUnreadCountUseCase.execute(userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success({ unreadCount }, "Unread message count retrieved")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to get unread count")
            );
        }
    }
}
