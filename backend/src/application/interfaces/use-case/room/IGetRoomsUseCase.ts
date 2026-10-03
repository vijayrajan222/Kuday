import type { RoomEntity } from "../../../../domain/entities/RoomEntity.js";

export interface IGetRoomsUseCase {
    execute(): Promise<RoomEntity[]>;
    getByHostId(hostId: string): Promise<RoomEntity[]>;
}
