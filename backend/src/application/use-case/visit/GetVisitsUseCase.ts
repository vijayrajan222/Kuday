import type { IVisitRepository } from "@application/interfaces/repository/IVisitRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IGetVisitsUseCase } from "@application/interfaces/use-case/visit/IGetVisitsUseCase";
import type { VisitDetailDto, VisitParticipantDto, VisitRoomSummaryDto } from "@application/dto/visit/VisitDetailDto";
import type { VisitEntity } from "@domain/entities/VisitEntity";
import type { RoomEntity } from "@domain/entities/RoomEntity";

export class GetVisitsUseCase implements IGetVisitsUseCase {
    constructor(
        private readonly visitRepo: IVisitRepository,
        private readonly userRepo: IUserRepository,
        private readonly roomRepo?: IRoomRepository
    ) {}

    async getByConnectionId(connectionId: string): Promise<VisitDetailDto[]> {
        const visits = await this.visitRepo.findByConnectionId(connectionId);
        return this.enrichVisits(visits);
    }

    async getByUserId(userId: string): Promise<VisitDetailDto[]> {
        const visits = await this.visitRepo.findByUserId(userId);
        return this.enrichVisits(visits);
    }

    private async enrichVisits(visits: VisitEntity[]): Promise<VisitDetailDto[]> {
        const userCache = new Map<string, VisitParticipantDto>();
        const roomCache = new Map<string, VisitRoomSummaryDto>();

        const getUser = async (id: string): Promise<VisitParticipantDto | undefined> => {
            if (!id) return undefined;
            if (userCache.has(id)) return userCache.get(id);
            const user = await this.userRepo.findById(id);
            if (!user) return undefined;
            const participant: VisitParticipantDto = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                selfieUrl: user.selfieUrl,
                identityVerified: user.identityVerified,
                occupation: user.occupation,
                role: user.role,
            };
            userCache.set(id, participant);
            return participant;
        };

        const getRoom = async (id: string, hostId: string): Promise<VisitRoomSummaryDto | undefined> => {
            if (!this.roomRepo) return undefined;
            if (id && roomCache.has(id)) return roomCache.get(id);

            let roomEntity: RoomEntity | null = id ? await this.roomRepo.findById(id) : null;
            if (!roomEntity && hostId) {
                const hostRooms = await this.roomRepo.findByHostId(hostId);
                if (hostRooms.length > 0 && hostRooms[0]) {
                    roomEntity = hostRooms[0];
                }
            }

            if (!roomEntity) return undefined;
            const summary: VisitRoomSummaryDto = {
                id: roomEntity.id,
                title: roomEntity.title || undefined,
                location: roomEntity.location,
                monthlyRent: roomEntity.monthlyRent,
                roomType: roomEntity.roomType,
                images: roomEntity.images || undefined,
            };
            if (roomEntity.id) roomCache.set(roomEntity.id, summary);
            return summary;
        };

        const enriched: VisitDetailDto[] = [];
        for (const v of visits) {
            const [seeker, host, room] = await Promise.all([
                getUser(v.seekerId),
                getUser(v.hostId),
                getRoom(v.roomId || "", v.hostId),
            ]);

            enriched.push({
                ...v,
                seeker,
                host,
                room,
            });
        }

        return enriched;
    }
}
