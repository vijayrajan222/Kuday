import type { MessageEntity } from "@domain/entities/MessageEntity";
import type { ConversationEntity } from "@domain/entities/ConversationEntity";
import type {
    GetMessagesDto,
    GetMessagesByOtherUserInputDto,
    GetMessagesByOtherUserOutputDto,
    GetMessagesByOtherUserInput,
    GetMessagesByOtherUserOutput,
} from "@application/dto/chat/ChatDto";

export type {
    GetMessagesDto,
    GetMessagesByOtherUserInput,
    GetMessagesByOtherUserOutput,
    GetMessagesByOtherUserInputDto,
    GetMessagesByOtherUserOutputDto,
};

export interface IGetMessagesUseCase {
    execute(dto: GetMessagesDto): Promise<MessageEntity[]>;
    execute(conversationId: string, userId: string, limit?: number, before?: string): Promise<MessageEntity[]>;
    execute(
        dtoOrConversationId: GetMessagesDto | string,
        userId?: string,
        limit?: number,
        before?: string
    ): Promise<MessageEntity[]>;
    executeByUser(input: GetMessagesByOtherUserInputDto): Promise<GetMessagesByOtherUserOutputDto>;
}
