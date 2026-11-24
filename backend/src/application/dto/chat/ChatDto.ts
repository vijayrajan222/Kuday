import type { MessageEntity } from "@domain/entities/MessageEntity";
import type { ConversationEntity } from "@domain/entities/ConversationEntity";
import type { NotificationEntity } from "@domain/entities/NotificationEntity";

export interface SendMessageDto {
    senderId: string;
    receiverId: string;
    content: string;
    conversationId?: string;
}

export interface SendMessageResponseDto {
    message: MessageEntity;
    conversation: ConversationEntity;
    notification?: NotificationEntity;
    senderName?: string;
}

export interface GetConversationsDto {
    userId: string;
}

export interface GetMessagesDto {
    conversationId: string;
    userId: string;
    limit?: number | undefined;
    before?: string | undefined;
}

export interface GetMessagesByOtherUserInputDto {
    userId: string;
    otherUserId: string;
    limit?: number | undefined;
    page?: number | undefined;
    before?: string | undefined;
}

export interface GetMessagesByOtherUserOutputDto {
    messages: MessageEntity[];
    conversation: ConversationEntity;
    total: number;
}

export interface GetUnreadCountDto {
    userId: string;
}

export interface MarkMessagesAsReadDto {
    conversationId: string;
    userId: string;
}

export interface StartConversationDto {
    userId: string;
    recipientId: string;
}

// Aliases for backwards compatibility
export type GetMessagesByOtherUserInput = GetMessagesByOtherUserInputDto;
export type GetMessagesByOtherUserOutput = GetMessagesByOtherUserOutputDto;
