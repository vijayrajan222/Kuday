import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { IMarkMessagesAsReadUseCase } from "@application/interfaces/use-case/chat/IMarkMessagesAsReadUseCase";

export class SocketService {
    private io: Server | null = null;
    // Map userId -> Set of socketIds (supports multi-tab)
    private userSocketMap = new Map<string, Set<string>>();

    constructor(
        private sendMessageUseCase: ISendMessageUseCase,
        private markMessagesAsReadUseCase: IMarkMessagesAsReadUseCase
    ) {}

    init(httpServer: HttpServer): Server {
        this.io = new Server(httpServer, {
            cors: {
                origin: ["http://localhost:5173", "http://localhost:3000"],
                credentials: true,
                methods: ["GET", "POST"],
            },
            pingTimeout: 60000,
        });

        this.io.on("connection", (socket: Socket) => {
            const userId =
                (socket.handshake.auth?.userId as string) ||
                (socket.handshake.query?.userId as string);

            if (userId) {
                if (!this.userSocketMap.has(userId)) {
                    this.userSocketMap.set(userId, new Set());
                }
                this.userSocketMap.get(userId)?.add(socket.id);

                // Broadcast online status
                socket.broadcast.emit("user_status_changed", { userId, status: "online" });
            }

            // Join a conversation room
            socket.on("join_conversation", (conversationId: string) => {
                if (conversationId) {
                    socket.join(`conv_${conversationId}`);
                }
            });

            // Leave a conversation room
            socket.on("leave_conversation", (conversationId: string) => {
                if (conversationId) {
                    socket.leave(`conv_${conversationId}`);
                }
            });

            // Send message over socket
            socket.on("send_message", async (data: {
                senderId: string;
                receiverId: string;
                content: string;
                conversationId?: string;
            }, callback?: (response: unknown) => void) => {
                try {
                    const result = await this.sendMessageUseCase.execute(data);

                    // Broadcast message to everyone in the conversation room
                    this.io?.to(`conv_${result.conversation.id}`).emit("new_message", result.message);

                    // Also notify receiver individually for badge / push update
                    const receiverSockets = this.userSocketMap.get(data.receiverId);
                    if (receiverSockets) {
                        receiverSockets.forEach((sockId) => {
                            this.io?.to(sockId).emit("message_notification", {
                                message: result.message,
                                conversation: result.conversation,
                            });
                        });
                    }

                    if (callback) {
                        callback({ success: true, data: result });
                    }
                } catch (error) {
                    if (callback) {
                        callback({
                            success: false,
                            error: error instanceof Error ? error.message : "Failed to send message",
                        });
                    }
                }
            });

            // User typing indicator
            socket.on("typing", (data: { conversationId: string; userId: string; userName?: string }) => {
                if (data.conversationId) {
                    socket.to(`conv_${data.conversationId}`).emit("user_typing", data);
                }
            });

            // User stopped typing indicator
            socket.on("stop_typing", (data: { conversationId: string; userId: string }) => {
                if (data.conversationId) {
                    socket.to(`conv_${data.conversationId}`).emit("user_stop_typing", data);
                }
            });

            // Mark messages as read in conversation
            socket.on("mark_read", async (data: { conversationId: string; userId: string }) => {
                try {
                    if (data.conversationId && data.userId) {
                        await this.markMessagesAsReadUseCase.execute(data.conversationId, data.userId);
                        this.io?.to(`conv_${data.conversationId}`).emit("messages_read", {
                            conversationId: data.conversationId,
                            readBy: data.userId,
                        });
                    }
                } catch (err) {
                    console.error("Failed to mark messages as read via socket:", err);
                }
            });

            // Disconnect handling
            socket.on("disconnect", () => {
                if (userId && this.userSocketMap.has(userId)) {
                    const userSockets = this.userSocketMap.get(userId);
                    userSockets?.delete(socket.id);
                    if (userSockets?.size === 0) {
                        this.userSocketMap.delete(userId);
                        socket.broadcast.emit("user_status_changed", { userId, status: "offline" });
                    }
                }
            });
        });

        return this.io;
    }

    getIo(): Server | null {
        return this.io;
    }

    isUserOnline(userId: string): boolean {
        const sockets = this.userSocketMap.get(userId);
        return Boolean(sockets && sockets.size > 0);
    }
}
