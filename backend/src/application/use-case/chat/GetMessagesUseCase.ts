import type {
    IGetMessagesUseCase,
} from "@application/interfaces/use-case/chat/IGetMessagesUseCase";
import type {
    GetMessagesDto,
    GetMessagesByOtherUserInputDto,
    GetMessagesByOtherUserOutputDto,
    GetMessagesByOtherUserInput,
    GetMessagesByOtherUserOutput,
} from "@application/dto/chat/ChatDto";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";
import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { MessageEntity } from "@domain/entities/MessageEntity";
import { NotFoundError, ForbiddenError } from "@application/errors/AppError";

export class GetMessagesUseCase implements IGetMessagesUseCase {
    constructor(
        private messageRepository: IMessageRepository,
        private conversationRepository: IConversationRepository,
        private interestRepository?: IInterestRepository
    ) {}

    async execute(
        dtoOrConversationId: GetMessagesDto | string,
        rawUserId?: string,
        limitParam = 50,
        beforeParam?: string
    ): Promise<MessageEntity[]> {
        const conversationId = typeof dtoOrConversationId === "object" ? dtoOrConversationId.conversationId : dtoOrConversationId;
        const userId = typeof dtoOrConversationId === "object" ? dtoOrConversationId.userId : rawUserId!;
        const limit = typeof dtoOrConversationId === "object" ? (dtoOrConversationId.limit ?? 50) : limitParam;
        const before = typeof dtoOrConversationId === "object" ? dtoOrConversationId.before : beforeParam;
        const conversation = await this.conversationRepository.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError("Conversation not found");
        }

        if (!conversation.participants.includes(userId)) {
            throw new ForbiddenError("User is not a participant in this conversation");
        }

        return this.messageRepository.findByConversationId(conversationId, limit, before);
    }

    async executeByUser(input: GetMessagesByOtherUserInput): Promise<GetMessagesByOtherUserOutput> {
        const { userId, otherUserId, limit = 50, page = 1, before } = input;

        if (this.interestRepository) {
            const accepted = await this.interestRepository.findAcceptedBetween(userId, otherUserId);
            if (!accepted) {
                throw new ForbiddenError(
                    "Chat is only allowed between users with an accepted connection request"
                );
            }
        }

        const conversation = await this.conversationRepository.findOrCreate(userId, otherUserId);
        const { messages, total } = await this.messageRepository.findByConversationIdPaginated(
            conversation.id,
            limit,
            page,
            before
        );

        return {
            messages,
            conversation,
            total,
        };
    }
}
