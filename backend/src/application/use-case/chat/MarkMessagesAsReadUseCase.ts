import type { IMarkMessagesAsReadUseCase } from "@application/interfaces/use-case/chat/IMarkMessagesAsReadUseCase";
import type { MarkMessagesAsReadDto } from "@application/dto/chat/ChatDto";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";

export class MarkMessagesAsReadUseCase implements IMarkMessagesAsReadUseCase {
    constructor(private messageRepository: IMessageRepository) {}

    async execute(dtoOrConvId: MarkMessagesAsReadDto | string, rawUserId?: string): Promise<void> {
        const conversationId = typeof dtoOrConvId === "object" ? dtoOrConvId.conversationId : dtoOrConvId;
        const userId = typeof dtoOrConvId === "object" ? dtoOrConvId.userId : rawUserId!;
        await this.messageRepository.markAsRead(conversationId, userId);
    }
}
