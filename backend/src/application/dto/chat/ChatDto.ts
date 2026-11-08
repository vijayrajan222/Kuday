import type { MessageEntity } from "@domain/entities/MessageEntity";
import type { ConversationEntity } from "@domain/entities/ConversationEntity";

export interface SendMessageDto {
    senderId: string;
    receiverId: string;
    content: string;
    conversationId?: string;
}

export interface SendMessageResponseDto {
    message: MessageEntity;
    conversation: ConversationEntity;
}
