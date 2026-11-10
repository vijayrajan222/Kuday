import type { MessageEntity } from "@domain/entities/MessageEntity";
import type { ConversationEntity } from "@domain/entities/ConversationEntity";

export interface GetMessagesByOtherUserInput {
    userId: string;
    otherUserId: string;
    limit?: number;
    page?: number;
    before?: string;
}

export interface GetMessagesByOtherUserOutput {
    messages: MessageEntity[];
    conversation: ConversationEntity;
    total: number;
}

export interface IGetMessagesUseCase {
    execute(conversationId: string, userId: string, limit?: number, before?: string): Promise<MessageEntity[]>;
    executeByUser(input: GetMessagesByOtherUserInput): Promise<GetMessagesByOtherUserOutput>;
}
