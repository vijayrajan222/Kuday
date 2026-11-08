import type { IGetConversationsUseCase } from "@application/interfaces/use-case/chat/IGetConversationsUseCase";
import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ConversationEntity, ConversationParticipant } from "@domain/entities/ConversationEntity";

export class GetConversationsUseCase implements IGetConversationsUseCase {
    constructor(
        private conversationRepository: IConversationRepository,
        private messageRepository: IMessageRepository,
        private userRepository: IUserRepository
    ) {}

    async execute(userId: string): Promise<ConversationEntity[]> {
        const conversations = await this.conversationRepository.findByUserId(userId);

        const enriched: ConversationEntity[] = [];

        for (const conv of conversations) {
            const participantDetails: ConversationParticipant[] = [];

            for (const pId of conv.participants) {
                const user = await this.userRepository.findById(pId);
                if (user) {
                    participantDetails.push({
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        selfieUrl: user.selfieUrl,
                        role: user.role,
                        occupation: user.occupation,
                        identityVerified: Boolean(user.identityVerified),
                    });
                }
            }

            const unreadCount = await this.messageRepository.countUnreadByConversation(conv.id, userId);

            enriched.push({
                ...conv,
                participantDetails,
                unreadCount,
            });
        }

        // Sort by last message or updated timestamp descending
        return enriched.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.updatedAt || "";
            const timeB = b.lastMessage?.createdAt || b.updatedAt || "";
            return timeB.localeCompare(timeA);
        });
    }
}
