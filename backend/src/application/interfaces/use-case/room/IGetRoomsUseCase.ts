import type { RoomWithHostDto } from "@application/dto/room/GetRoomResponseDto";

export interface IGetRoomsUseCase {
    execute(seekerUserId?: string): Promise<RoomWithHostDto[]>;
    getByHostId(hostId: string): Promise<RoomWithHostDto[]>;
    getById(id: string, seekerUserId?: string): Promise<RoomWithHostDto | null>;
}
