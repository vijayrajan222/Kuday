import type { IGetMessagesUseCase } from "@application/interfaces/use-case/chat/IGetMessagesUseCase";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";
import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { MessageEntity } from "@domain/entities/MessageEntity";

export class GetMessagesUseCase implements IGetMessagesUseCase {
    constructor(
        private messageRepository: IMessageRepository,
        private conversationRepository: IConversationRepository
    ) {}

    async execute(
        conversationId: string,
        userId: string,
        limit = 50,
        before?: string
    ): Promise<MessageEntity[]> {
        const conversation = await this.conversationRepository.findById(conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        if (!conversation.participants.includes(userId)) {
            throw new Error("User is not a participant in this conversation");
        }

        return this.messageRepository.findByConversationId(conversationId, limit, before);
    }
}
