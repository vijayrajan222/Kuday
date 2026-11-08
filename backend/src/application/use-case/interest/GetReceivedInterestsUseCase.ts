import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IGetReceivedInterestsUseCase } from "@application/interfaces/use-case/interest/IGetReceivedInterestsUseCase";
import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";

export class GetReceivedInterestsUseCase implements IGetReceivedInterestsUseCase {
    constructor(
        private readonly interestRepo: IInterestRepository,
        private readonly userRepo: IUserRepository
    ) {}

    async execute(userId: string): Promise<InterestDetailDto[]> {
        const interests = await this.interestRepo.findByReceiverId(userId);

        const results: InterestDetailDto[] = [];
        for (const interest of interests) {
            // Ignore cancelled or unmatched requests
            if (interest.status === "cancelled" || interest.status === "unmatched") {
                continue;
            }

            const sender = await this.userRepo.findById(interest.senderId);

            // Check if there is an accepted connection with this sender in either direction
            const mutual = await this.interestRepo.findBetweenUsers(userId, interest.senderId);
            const isAccepted = mutual.some((m) => m.status === "accepted");
            const effectiveStatus = isAccepted ? "accepted" : interest.status;

            // Self-heal the database document if it was still 'pending'
            if (isAccepted && interest.status !== "accepted") {
                await this.interestRepo.updateStatusBetweenUsers(userId, interest.senderId, "accepted");
            }

            results.push({
                id: interest.id,
                senderId: interest.senderId,
                receiverId: interest.receiverId,
                targetType: interest.targetType,
                targetId: interest.targetId,
                status: effectiveStatus,
                message: interest.message,
                createdAt: interest.createdAt,
                updatedAt: interest.updatedAt,
                sender: sender
                    ? {
                          id: sender.id,
                          firstName: sender.firstName,
                          lastName: sender.lastName,
                          email: sender.email,
                          selfieUrl: sender.selfieUrl,
                          role: sender.role,
                          occupation: sender.occupation,
                          identityVerified: Boolean(sender.identityVerified),
                      }
                    : undefined,
            });
        }

        return results;
    }
}
