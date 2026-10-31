import type { RoomWithHostDto } from "../../../dto/room/GetRoomResponseDto.js";

export interface IGetRoomsUseCase {
    execute(seekerUserId?: string): Promise<RoomWithHostDto[]>;
    getByHostId(hostId: string): Promise<RoomWithHostDto[]>;
}
