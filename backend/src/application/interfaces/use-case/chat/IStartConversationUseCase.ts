import type { ConversationEntity } from "@domain/entities/ConversationEntity";

export interface IStartConversationUseCase {
    execute(userId: string, recipientId: string): Promise<ConversationEntity>;
}
