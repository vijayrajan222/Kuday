import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";
import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { SendMessageDto, SendMessageResponseDto } from "@application/dto/chat/ChatDto";
import type { NotificationEntity } from "@domain/entities/NotificationEntity";
import { ValidationError, ForbiddenError } from "@application/errors/AppError";

export class SendMessageUseCase implements ISendMessageUseCase {
    constructor(
        private messageRepository: IMessageRepository,
        private conversationRepository: IConversationRepository,
        private notificationRepository?: INotificationRepository,
        private userRepository?: IUserRepository,
        private interestRepository?: IInterestRepository
    ) {}

    async execute(dto: SendMessageDto): Promise<SendMessageResponseDto> {
        if (!dto.senderId || !dto.receiverId) {
            throw new ValidationError("Sender and receiver are required");
        }
        if (!dto.content || !dto.content.trim()) {
            throw new ValidationError("Message content cannot be empty");
        }

        // Verify accepted connection request
        if (this.interestRepository) {
            const acceptedConn = await this.interestRepository.findAcceptedBetween(dto.senderId, dto.receiverId);
            if (!acceptedConn) {
                throw new ForbiddenError(
                    "Chat is only allowed between users with an accepted connection request"
                );
            }
        }

        let conversation = null;
        if (dto.conversationId) {
            conversation = await this.conversationRepository.findById(dto.conversationId);
        }

        if (!conversation) {
            conversation = await this.conversationRepository.findOrCreate(dto.senderId, dto.receiverId);
        }

        // Verify sender is participant
        if (!conversation.participants.includes(dto.senderId)) {
            throw new ForbiddenError("User is not authorized in this conversation");
        }

        const now = new Date().toISOString();

        const message = await this.messageRepository.create({
            conversationId: conversation.id,
            senderId: dto.senderId,
            receiverId: dto.receiverId,
            content: dto.content.trim(),
            type: "text",
            isRead: false,
        });

        await this.conversationRepository.updateLastMessage(conversation.id, {
            content: dto.content.trim(),
            senderId: dto.senderId,
            createdAt: now,
        });

        // Update returned conversation object
        conversation.lastMessage = {
            content: dto.content.trim(),
            senderId: dto.senderId,
            createdAt: now,
        };

        // Create notification for receiver
        let notification: NotificationEntity | undefined = undefined;
        let senderName = "Someone";

        try {
            if (this.userRepository) {
                const sender = await this.userRepository.findById(dto.senderId);
                if (sender) {
                    senderName = `${sender.firstName || ""} ${sender.lastName || ""}`.trim() || sender.email;
                }
            }

            if (this.notificationRepository) {
                notification = await this.notificationRepository.create({
                    userId: dto.receiverId,
                    title: `New message from ${senderName}`,
                    message: dto.content.trim(),
                    type: "chat_message",
                    isRead: false,
                });
            }
        } catch (notifErr) {
            console.error("Failed to create notification for message:", notifErr);
        }

        return {
            message,
            conversation,
            ...(notification ? { notification } : {}),
            senderName,
        };
    }
}
