import type { IMarkMessagesAsReadUseCase } from "@application/interfaces/use-case/chat/IMarkMessagesAsReadUseCase";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";

export class MarkMessagesAsReadUseCase implements IMarkMessagesAsReadUseCase {
    constructor(private messageRepository: IMessageRepository) {}

    async execute(conversationId: string, userId: string): Promise<void> {
        await this.messageRepository.markAsRead(conversationId, userId);
    }
}
