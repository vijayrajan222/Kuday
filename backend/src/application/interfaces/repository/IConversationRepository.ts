import type { ConversationEntity } from "@domain/entities/ConversationEntity";

export interface IConversationRepository {
    findOrCreate(participant1: string, participant2: string): Promise<ConversationEntity>;
    findById(id: string): Promise<ConversationEntity | null>;
    findByUserId(userId: string): Promise<ConversationEntity[]>;
    findByParticipants(participant1: string, participant2: string): Promise<ConversationEntity | null>;
    updateLastMessage(
        conversationId: string,
        lastMessage: { content: string; senderId: string; createdAt: string }
    ): Promise<void>;
}
