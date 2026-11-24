import type { MarkMessagesAsReadDto } from "@application/dto/chat/ChatDto";

export type { MarkMessagesAsReadDto };

export interface IMarkMessagesAsReadUseCase {
    execute(dto: MarkMessagesAsReadDto): Promise<void>;
    execute(conversationId: string, userId: string): Promise<void>;
    execute(dtoOrConvId: MarkMessagesAsReadDto | string, userId?: string): Promise<void>;
}
