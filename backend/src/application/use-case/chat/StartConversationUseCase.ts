import type { IStartConversationUseCase } from "@application/interfaces/use-case/chat/IStartConversationUseCase";
import type { StartConversationDto } from "@application/dto/chat/ChatDto";
import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ConversationEntity, ConversationParticipant } from "@domain/entities/ConversationEntity";

export class StartConversationUseCase implements IStartConversationUseCase {
    constructor(
        private conversationRepository: IConversationRepository,
        private userRepository: IUserRepository
    ) {}

    async execute(dtoOrUserId: StartConversationDto | string, rawRecipientId?: string): Promise<ConversationEntity> {
        const userId = typeof dtoOrUserId === "object" ? dtoOrUserId.userId : dtoOrUserId;
        const recipientId = typeof dtoOrUserId === "object" ? dtoOrUserId.recipientId : rawRecipientId!;
        if (!userId || !recipientId) {
            throw new Error("Both participants are required to start a conversation");
        }
        if (userId === recipientId) {
            throw new Error("Cannot start a conversation with yourself");
        }

        const recipient = await this.userRepository.findById(recipientId);
        if (!recipient) {
            throw new Error("Recipient user does not exist");
        }

        const conv = await this.conversationRepository.findOrCreate(userId, recipientId);

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
                    isPremium: Boolean(user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date()),
                });
            }
        }

        return {
            ...conv,
            participantDetails,
            unreadCount: 0,
        };
    }
}
