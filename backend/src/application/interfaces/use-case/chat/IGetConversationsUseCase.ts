import type { ConversationEntity } from "@domain/entities/ConversationEntity";

export interface IGetConversationsUseCase {
    execute(userId: string): Promise<ConversationEntity[]>;
}
