import type { RoomWithHostDto } from "@application/dto/room/GetRoomResponseDto.js";

export interface IGetRoomsUseCase {
    execute(seekerUserId?: string): Promise<RoomWithHostDto[]>;
    getByHostId(hostId: string): Promise<RoomWithHostDto[]>;
}
