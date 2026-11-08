import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IGetSentInterestsUseCase } from "@application/interfaces/use-case/interest/IGetSentInterestsUseCase";
import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";

export class GetSentInterestsUseCase implements IGetSentInterestsUseCase {
    constructor(
        private readonly interestRepo: IInterestRepository,
        private readonly userRepo: IUserRepository
    ) {}

    async execute(userId: string): Promise<InterestDetailDto[]> {
        const interests = await this.interestRepo.findBySenderId(userId);

        const results: InterestDetailDto[] = [];
        for (const interest of interests) {
            const receiver = await this.userRepo.findById(interest.receiverId);

            // Check if there is an accepted connection with this receiver in either direction
            const mutual = await this.interestRepo.findBetweenUsers(userId, interest.receiverId);
            const isAccepted = mutual.some((m) => m.status === "accepted");
            const effectiveStatus = isAccepted ? "accepted" : interest.status;

            // Self-heal the database document if it was still 'pending'
            if (isAccepted && interest.status !== "accepted") {
                await this.interestRepo.updateStatusBetweenUsers(userId, interest.receiverId, "accepted");
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
                receiver: receiver
                    ? {
                          id: receiver.id,
                          firstName: receiver.firstName,
                          lastName: receiver.lastName,
                          email: receiver.email,
                          selfieUrl: receiver.selfieUrl,
                          role: receiver.role,
                      }
                    : undefined,
            });
        }

        return results;
    }
}
