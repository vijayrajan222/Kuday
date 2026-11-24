import type { ConversationEntity } from "@domain/entities/ConversationEntity";
import type { GetConversationsDto } from "@application/dto/chat/ChatDto";

export type { GetConversationsDto };

export interface IGetConversationsUseCase {
    execute(dto: GetConversationsDto): Promise<ConversationEntity[]>;
    execute(userId: string): Promise<ConversationEntity[]>;
    execute(dtoOrUserId: GetConversationsDto | string): Promise<ConversationEntity[]>;
}
