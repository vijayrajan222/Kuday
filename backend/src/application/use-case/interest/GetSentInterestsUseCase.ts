import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IGetSentInterestsUseCase } from "@application/interfaces/use-case/interest/IGetSentInterestsUseCase";
import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";

export class GetSentInterestsUseCase implements IGetSentInterestsUseCase {
    constructor(
        private readonly interestRepo: IInterestRepository,
        private readonly userRepo: IUserRepository,
        private readonly roomRepo?: IRoomRepository,
        private readonly agreementRepo?: IAgreementRepository
    ) {}

    async execute(userId: string): Promise<InterestDetailDto[]> {
        const interests = await this.interestRepo.findBySenderId(userId);

        let activeRoommatePartnerId: string | null = null;
        if (this.agreementRepo) {
            const userAgreements = await this.agreementRepo.findByUser(userId);
            const active = userAgreements.find((a) => a.status === "completed");
            if (active) {
                activeRoommatePartnerId = active.hostId === userId ? active.seekerId : active.hostId;
            }
        }

        const results: InterestDetailDto[] = [];
        for (const interest of interests) {
            // Ignore cancelled or unmatched requests
            if (interest.status === "cancelled" || interest.status === "unmatched") {
                continue;
            }

            // Exclude active roommate partner from Matched/Interests list
            if (activeRoommatePartnerId && interest.receiverId === activeRoommatePartnerId) {
                continue;
            }

            const receiver = await this.userRepo.findById(interest.receiverId);

            // Check if there is an accepted connection with this receiver in either direction
            const mutual = await this.interestRepo.findBetweenUsers(userId, interest.receiverId);
            const isAccepted = mutual.some((m) => m.status === "accepted");
            const effectiveStatus = isAccepted ? "accepted" : interest.status;

            // Self-heal the database document if it was still 'pending'
            if (isAccepted && interest.status !== "accepted") {
                await this.interestRepo.updateStatusBetweenUsers(userId, interest.receiverId, "accepted");
            }

            let roomSummary: InterestDetailDto["room"] = undefined;
            if (this.roomRepo) {
                let roomEntity = null;
                if (interest.targetType === "room") {
                    roomEntity = await this.roomRepo.findById(interest.targetId);
                }
                if (!roomEntity) {
                    const hostId = receiver?.role === "host" ? receiver.id : userId;
                    const hostRooms = await this.roomRepo.findByHostId(hostId);
                    if (hostRooms.length > 0) {
                        roomEntity = hostRooms[0];
                    }
                }
                if (roomEntity) {
                    const isOccupied = (roomEntity.availableSlots ?? 0) <= 0 || roomEntity.isActive === false;
                    roomSummary = {
                        id: roomEntity.id,
                        title: roomEntity.title || roomEntity.roomType,
                        capacity: roomEntity.capacity ?? 0,
                        availableSlots: roomEntity.availableSlots,
                        isActive: roomEntity.isActive ?? true,
                        isOccupied,
                    };
                }
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
                room: roomSummary,
                receiver: receiver
                    ? {
                          id: receiver.id,
                          firstName: receiver.firstName,
                          lastName: receiver.lastName,
                          email: receiver.email,
                          selfieUrl: receiver.selfieUrl,
                          role: receiver.role,
                          occupation: receiver.occupation,
                          identityVerified: Boolean(receiver.identityVerified),
                      }
                    : undefined,
            });
        }

        return results;
    }
}
