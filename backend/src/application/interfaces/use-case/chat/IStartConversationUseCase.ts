import type { ConversationEntity } from "@domain/entities/ConversationEntity";
import type { StartConversationDto } from "@application/dto/chat/ChatDto";

export type { StartConversationDto };

export interface IStartConversationUseCase {
    execute(dto: StartConversationDto): Promise<ConversationEntity>;
    execute(userId: string, recipientId: string): Promise<ConversationEntity>;
    execute(dtoOrUserId: StartConversationDto | string, recipientId?: string): Promise<ConversationEntity>;
}
