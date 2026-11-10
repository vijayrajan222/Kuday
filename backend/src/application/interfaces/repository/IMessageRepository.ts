import type { MessageEntity } from "@domain/entities/MessageEntity";

export interface IMessageRepository {
    create(data: Omit<MessageEntity, "id" | "createdAt" | "updatedAt">): Promise<MessageEntity>;
    findByConversationId(conversationId: string, limit?: number, before?: string): Promise<MessageEntity[]>;
    findByConversationIdPaginated(
        conversationId: string,
        limit?: number,
        page?: number,
        before?: string
    ): Promise<{ messages: MessageEntity[]; total: number }>;
    markAsRead(conversationId: string, receiverId: string): Promise<void>;
    countUnread(userId: string): Promise<number>;
    countUnreadByConversation(conversationId: string, userId: string): Promise<number>;
}
