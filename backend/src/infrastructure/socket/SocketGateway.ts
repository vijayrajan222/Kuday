import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import type { IJwtService } from "@application/interfaces/services/IJwtServices";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { ISocketChatService } from "@application/interfaces/services/ISocketChatService";
import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { IMarkMessagesAsReadUseCase } from "@application/interfaces/use-case/chat/IMarkMessagesAsReadUseCase";
import type { ICallSessionStore } from "@application/interfaces/services/ICallSessionStore";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import { ForbiddenError } from "@application/errors/AppError";
import type { IStartCallUseCase } from "@application/interfaces/use-case/call/IStartCallUseCase";
import type { ILogCallUseCase } from "@application/interfaces/use-case/call/ILogCallUseCase";
import type { CallOutcome, CallType } from "@domain/entities/MessageEntity";

export interface AuthenticatedSocket extends Socket {
    data: {
        userId?: string;
        userEmail?: string;
    };
}

export class SocketGateway implements ISocketNotificationService, ISocketChatService {
    private io: Server | null = null;
    // Map userId -> Set of socketIds (supports multi-tab)
    private userSocketMap = new Map<string, Set<string>>();
    // Ring timeouts for calls (30s)
    private ringTimeouts = new Map<string, NodeJS.Timeout>();
    // Double logging prevention
    private loggedCallIds = new Set<string>();

    constructor(
        private jwtService: IJwtService,
        private sendMessageUseCase: ISendMessageUseCase,
        private markMessagesAsReadUseCase: IMarkMessagesAsReadUseCase,
        private callSessionStore: ICallSessionStore,
        private startCallUseCase: IStartCallUseCase,
        private logCallUseCase: ILogCallUseCase,
        private subscriptionRepository?: ISubscriptionRepository,
        private userRepository?: IUserRepository
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

        // Authentication Middleware for handshake
        this.io.use((socket: AuthenticatedSocket, next) => {
            try {
                const token =
                    (socket.handshake.auth?.token as string) ||
                    (socket.handshake.headers?.authorization?.startsWith("Bearer ")
                        ? socket.handshake.headers.authorization.split(" ")[1]
                        : undefined);

                if (!token) {
                    // Fall back to userId for backward compatibility if present in query or auth
                    const userId =
                        (socket.handshake.auth?.userId as string) ||
                        (socket.handshake.query?.userId as string);
                    if (userId) {
                        socket.data.userId = userId;
                        return next();
                    }
                    return next(new Error("Authentication error: Token missing"));
                }

                const decoded = this.jwtService.verifyToken(token);
                if (!decoded || !decoded.userId) {
                    return next(new Error("Authentication error: Invalid token"));
                }

                socket.data.userId = decoded.userId;
                return next();
            } catch (err: unknown) {
                return next(new Error(err instanceof Error ? err.message : "Authentication error"));
            }
        });

        this.io.on("connection", (socket: AuthenticatedSocket) => {
            const userId = socket.data.userId;

            if (userId) {
                if (!this.userSocketMap.has(userId)) {
                    this.userSocketMap.set(userId, new Set());
                }
                this.userSocketMap.get(userId)?.add(socket.id);
                // Also join user's own room for easy targeting
                socket.join(`user_${userId}`);

                // Broadcast online status
                socket.broadcast.emit("user_status_changed", { userId, status: "online" });
            }

            // ================== CHAT EVENTS ==================

            // 1. message:send
            socket.on("message:send", async (data: {
                receiverId: string;
                content: string;
                conversationId?: string;
            }, callback?: (response: unknown) => void) => {
                try {
                    const senderId = socket.data.userId;
                    if (!senderId) {
                        throw new Error("Unauthorized");
                    }

                    const result = await this.sendMessageUseCase.execute({
                        senderId,
                        receiverId: data.receiverId,
                        content: data.content,
                        ...(data.conversationId ? { conversationId: data.conversationId } : {}),
                    });

                    // Emit message:new to both sender and receiver
                    this.emitToUser(senderId, "message:new", result.message);
                    this.emitToUser(data.receiverId, "message:new", result.message);

                    // Also support room/legacy
                    this.io?.to(`conv_${result.conversation.id}`).emit("new_message", result.message);
                    this.notifyUser(data.receiverId, "message_notification", {
                        message: result.message,
                        conversation: result.conversation,
                        senderName: result.senderName,
                    });

                    if (callback) {
                        callback({ success: true, message: result.message, conversation: result.conversation });
                    }
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : "Failed to send message";
                    if (callback) {
                        callback({ success: false, error: message });
                    } else {
                        socket.emit("error", { message });
                    }
                }
            });

            // Legacy send_message support
            socket.on("send_message", async (data: {
                senderId: string;
                receiverId: string;
                content: string;
                conversationId?: string;
            }, callback?: (response: unknown) => void) => {
                try {
                    const senderId = socket.data.userId || data.senderId;
                    const result = await this.sendMessageUseCase.execute({
                        ...data,
                        senderId,
                    });

                    this.emitToUser(senderId, "message:new", result.message);
                    this.emitToUser(data.receiverId, "message:new", result.message);
                    this.io?.to(`conv_${result.conversation.id}`).emit("new_message", result.message);

                    this.notifyUser(data.receiverId, "message_notification", {
                        message: result.message,
                        conversation: result.conversation,
                        senderName: result.senderName,
                    });

                    if (result.notification) {
                        this.notifyUser(data.receiverId, "new_notification", result.notification);
                    }

                    if (callback) callback({ success: true, data: result });
                } catch (error: unknown) {
                    if (callback) {
                        callback({
                            success: false,
                            error: error instanceof Error ? error.message : "Failed to send message",
                        });
                    }
                }
            });

            // Conversation rooms & read status
            socket.on("join_conversation", (conversationId: string) => {
                if (conversationId) socket.join(`conv_${conversationId}`);
            });

            socket.on("leave_conversation", (conversationId: string) => {
                if (conversationId) socket.leave(`conv_${conversationId}`);
            });

            socket.on("typing", (data: { conversationId: string; userId: string; userName?: string }) => {
                if (data.conversationId) socket.to(`conv_${data.conversationId}`).emit("user_typing", data);
            });

            socket.on("stop_typing", (data: { conversationId: string; userId: string }) => {
                if (data.conversationId) socket.to(`conv_${data.conversationId}`).emit("user_stop_typing", data);
            });

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

            // ================== CALL EVENTS ==================

            // 1. call:invite
            socket.on("call:invite", async (data: {
                receiverId: string;
                callType: CallType;
            }, callback?: (response: unknown) => void) => {
                try {
                    const callerId = socket.data.userId;
                    if (!callerId) throw new Error("Unauthorized");

                    const session = await this.startCallUseCase.execute({
                        callerId,
                        receiverId: data.receiverId,
                        callType: data.callType,
                    });

                    // 30s ring timeout logs missed call
                    const timeout = setTimeout(async () => {
                        this.ringTimeouts.delete(session.callId);
                        await this.endAndLogCall(session.callId, "missed");
                    }, 30000);
                    this.ringTimeouts.set(session.callId, timeout);

                    // Notify receiver
                    this.emitToUser(data.receiverId, "call:incoming", {
                        callId: session.callId,
                        callerId: session.callerId,
                        callType: session.callType,
                    });

                    if (callback) {
                        callback({ success: true, callId: session.callId, session });
                    }
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : "Failed to start call";
                    if (callback) {
                        callback({ success: false, error: message });
                    }
                    socket.emit("call:error", { message });
                }
            });

            // 2. call:accept
            socket.on("call:accept", async (data: { callId: string }, callback?: (response: unknown) => void) => {
                try {
                    const userId = socket.data.userId;
                    const session = this.callSessionStore.get(data.callId);

                    if (!session || session.status !== "ringing") {
                        throw new Error("Call is no longer available");
                    }
                    if (session.receiverId !== userId) {
                        throw new Error("Unauthorized to accept this call");
                    }

                    // Re-check premium subscription so an expired subscription can't start a call
                    if (this.subscriptionRepository) {
                        let hostId = session.hostId;
                        if (!hostId && this.userRepository) {
                            const [caller, receiver] = await Promise.all([
                                this.userRepository.findById(session.callerId),
                                this.userRepository.findById(session.receiverId),
                            ]);
                            if (caller?.role === "host") hostId = caller.id;
                            else if (receiver?.role === "host") hostId = receiver.id;
                        }

                        if (!hostId || !(await this.subscriptionRepository.isHostPremium(hostId))) {
                            this.clearRingTimeout(session.callId);
                            await this.endAndLogCall(session.callId, "declined");
                            throw new ForbiddenError("Calls are available only for premium hosts");
                        }
                    }

                    // Clear ring timeout
                    this.clearRingTimeout(session.callId);

                    const answeredAt = new Date();
                    this.callSessionStore.update(session.callId, {
                        status: "ongoing",
                        answeredAt,
                    });

                    // Notify caller & receiver
                    this.emitToUser(session.callerId, "call:accepted", {
                        callId: session.callId,
                        answeredAt,
                    });
                    this.emitToUser(session.receiverId, "call:accepted", {
                        callId: session.callId,
                        answeredAt,
                    });

                    if (callback) callback({ success: true });
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : "Failed to accept call";
                    if (callback) callback({ success: false, error: message });
                    socket.emit("call:error", { message });
                }
            });

            // 3. call:decline
            socket.on("call:decline", async (data: { callId: string }, callback?: (response: unknown) => void) => {
                try {
                    this.clearRingTimeout(data.callId);
                    await this.endAndLogCall(data.callId, "declined");
                    if (callback) callback({ success: true });
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : "Failed to decline call";
                    if (callback) callback({ success: false, error: message });
                }
            });

            // 4. call:end
            socket.on("call:end", async (data: { callId: string }, callback?: (response: unknown) => void) => {
                try {
                    this.clearRingTimeout(data.callId);
                    const session = this.callSessionStore.get(data.callId);
                    if (!session) {
                        if (callback) callback({ success: true });
                        return;
                    }

                    let outcome: CallOutcome = "completed";
                    if (session.status === "ringing") {
                        outcome = socket.data.userId === session.callerId ? "missed" : "declined";
                    }

                    await this.endAndLogCall(session.callId, outcome);
                    if (callback) callback({ success: true });
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : "Failed to end call";
                    if (callback) callback({ success: false, error: message });
                }
            });

            // 5. webrtc:signal (relay offer/answer/ICE candidate)
            socket.on("webrtc:signal", (data: {
                callId?: string;
                to?: string;
                targetUserId?: string;
                signal?: unknown;
                candidate?: unknown;
                sdp?: unknown;
                type?: string;
            }) => {
                const targetUserId = data.to || data.targetUserId;
                const senderId = socket.data.userId;

                if (targetUserId) {
                    this.emitToUser(targetUserId, "webrtc:signal", {
                        from: senderId,
                        signal: data.signal !== undefined ? data.signal : data,
                        callId: data.callId,
                    });
                } else if (data.callId) {
                    const session = this.callSessionStore.get(data.callId);
                    if (session) {
                        const otherId = session.callerId === senderId ? session.receiverId : session.callerId;
                        this.emitToUser(otherId, "webrtc:signal", {
                            from: senderId,
                            signal: data.signal !== undefined ? data.signal : data,
                            callId: data.callId,
                        });
                    }
                }
            });

            // Disconnect handling (mid-call disconnect logs call message)
            socket.on("disconnect", async () => {
                if (userId) {
                    // Check if user was in a call
                    const activeSession = this.callSessionStore.getByUserId(userId);
                    if (activeSession) {
                        this.clearRingTimeout(activeSession.callId);
                        let outcome: CallOutcome = "completed";
                        if (activeSession.status === "ringing") {
                            outcome = activeSession.callerId === userId ? "missed" : "declined";
                        }
                        await this.endAndLogCall(activeSession.callId, outcome);
                    }

                    if (this.userSocketMap.has(userId)) {
                        const userSockets = this.userSocketMap.get(userId);
                        userSockets?.delete(socket.id);
                        if (userSockets?.size === 0) {
                            this.userSocketMap.delete(userId);
                            socket.broadcast.emit("user_status_changed", { userId, status: "offline" });
                        }
                    }
                }
            });
        });

        return this.io;
    }

    private clearRingTimeout(callId: string): void {
        const timeout = this.ringTimeouts.get(callId);
        if (timeout) {
            clearTimeout(timeout);
            this.ringTimeouts.delete(callId);
        }
    }

    private async endAndLogCall(callId: string, outcome: CallOutcome): Promise<void> {
        this.clearRingTimeout(callId);

        // Prevent double logging
        if (this.loggedCallIds.has(callId)) {
            return;
        }
        this.loggedCallIds.add(callId);

        const session = this.callSessionStore.get(callId);
        if (!session) {
            return;
        }

        const endedAt = new Date();
        this.callSessionStore.remove(callId);

        try {
            // Log call message
            const callMessage = await this.logCallUseCase.execute({
                callerId: session.callerId,
                receiverId: session.receiverId,
                callType: session.callType,
                outcome,
                startedAt: session.startedAt,
                endedAt,
                ...(session.answeredAt ? { answeredAt: session.answeredAt } : {}),
            });

            // Emit call:ended to both parties
            this.emitToUser(session.callerId, "call:ended", {
                callId: session.callId,
                reason: outcome,
            });
            this.emitToUser(session.receiverId, "call:ended", {
                callId: session.callId,
                reason: outcome,
            });

            // Emit message:new for the call log entry
            this.emitToUser(session.callerId, "message:new", callMessage);
            this.emitToUser(session.receiverId, "message:new", callMessage);
        } catch (err) {
            console.error("Error logging call outcome:", err);
        }
    }

    emitToUser(userId: string, event: string, payload: unknown): void {
        if (!this.io) return;
        this.io.to(`user_${userId}`).emit(event, payload);
    }

    getIo(): Server | null {
        return this.io;
    }

    isUserOnline(userId: string): boolean {
        const sockets = this.userSocketMap.get(userId);
        return Boolean(sockets && sockets.size > 0);
    }

    notifyUser(userId: string, event: string, payload: unknown): void {
        this.emitToUser(userId, event, payload);
    }
}
