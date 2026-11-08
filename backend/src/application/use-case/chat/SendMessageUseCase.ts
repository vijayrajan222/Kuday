import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";
import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { SendMessageDto, SendMessageResponseDto } from "@application/dto/chat/ChatDto";

export class SendMessageUseCase implements ISendMessageUseCase {
    constructor(
        private messageRepository: IMessageRepository,
        private conversationRepository: IConversationRepository
    ) {}

    async execute(dto: SendMessageDto): Promise<SendMessageResponseDto> {
        if (!dto.senderId || !dto.receiverId) {
            throw new Error("Sender and receiver are required");
        }
        if (!dto.content || !dto.content.trim()) {
            throw new Error("Message content cannot be empty");
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
            throw new Error("User is not authorized in this conversation");
        }

        const now = new Date().toISOString();

        const message = await this.messageRepository.create({
            conversationId: conversation.id,
            senderId: dto.senderId,
            receiverId: dto.receiverId,
            content: dto.content.trim(),
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

        return {
            message,
            conversation,
        };
    }
}
