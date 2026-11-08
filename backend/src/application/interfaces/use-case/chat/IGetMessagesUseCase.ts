import type { MessageEntity } from "@domain/entities/MessageEntity";

export interface IGetMessagesUseCase {
    execute(conversationId: string, userId: string, limit?: number, before?: string): Promise<MessageEntity[]>;
}
