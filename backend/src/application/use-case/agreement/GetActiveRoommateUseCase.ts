import type { IGetActiveRoommateUseCase } from "@application/interfaces/use-case/agreement/IGetActiveRoommateUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ActiveRoommateResponseDto } from "@application/dto/agreement/ActiveRoommateDto";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import type { UserEntity } from "@domain/entities/UserEntity";
import type { RoomEntity } from "@domain/entities/RoomEntity";

export class GetActiveRoommateUseCase implements IGetActiveRoommateUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository
    ) {}

    async execute(userId: string): Promise<ActiveRoommateResponseDto | ActiveRoommateResponseDto[] | null> {
        const currentUser = await this.userRepository.findById(userId);
        const userAgreements = await this.agreementRepository.findByUser(userId);
        const completedAgreements = userAgreements.filter((a) => a.status === "completed");

        // Determine if acting as host: role === 'host' or has rooms or host of completed agreements
        const isHost =
            currentUser?.role === "host" ||
            completedAgreements.some((a) => a.hostId === userId);

        if (isHost) {
            const hostCompleted = completedAgreements.filter((a) => a.hostId === userId);
            const results: ActiveRoommateResponseDto[] = [];
            for (const ag of hostCompleted) {
                const [partnerUser, room] = await Promise.all([
                    this.userRepository.findById(ag.seekerId),
                    this.roomRepository.findById(ag.roomId),
                ]);
                if (partnerUser && room) {
                    results.push(this.mapToDto(ag, partnerUser, room, "host"));
                }
            }
            return results;
        }

        // Seeker: single partner (the host)
        const active = completedAgreements.find((a) => a.seekerId === userId);
        if (!active) {
            return null;
        }

        const [partnerUser, room] = await Promise.all([
            this.userRepository.findById(active.hostId),
            this.roomRepository.findById(active.roomId),
        ]);

        if (!partnerUser || !room) {
            return null;
        }

        return this.mapToDto(active, partnerUser, room, "seeker");
    }

    private mapToDto(
        agreement: AgreementEntity,
        partnerUser: UserEntity,
        room: RoomEntity,
        userRole: "host" | "seeker"
    ): ActiveRoommateResponseDto {
        return {
            agreementId: agreement.id,
            hostId: agreement.hostId,
            seekerId: agreement.seekerId,
            userRole,
            startDate: agreement.startDate,
            endDate: agreement.endDate,
            status: agreement.status,
            commonTerms: {
                rent: agreement.commonTerms.rent,
                deposit: agreement.commonTerms.deposit,
                moveInDate: agreement.commonTerms.moveInDate,
                durationMonths: agreement.commonTerms.durationMonths,
                utilities: agreement.commonTerms.utilities,
            },
            partner: {
                id: partnerUser.id,
                firstName: partnerUser.firstName,
                lastName: partnerUser.lastName,
                email: partnerUser.email,
                role: partnerUser.role || "member",
                occupation: partnerUser.occupation,
                selfieUrl: partnerUser.selfieUrl,
                identityVerified: Boolean(partnerUser.identityVerified),
            },
            room: {
                id: room.id,
                title: room.title,
                roomType: room.roomType,
                monthlyRent: room.monthlyRent,
                location: room.location,
                images: room.images || [],
            },
        };
    }
}
