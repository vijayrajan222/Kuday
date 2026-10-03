import type { RoomEntity } from "../../../domain/entities/RoomEntity.js";

export interface IRoomRepository {
    create(roomData: Omit<RoomEntity, "id">): Promise<RoomEntity>;
    update(id: string, roomData: Partial<RoomEntity>): Promise<RoomEntity | null>;
    findByHostId(hostId: string): Promise<RoomEntity[]>;
    findAll(): Promise<RoomEntity[]>;
    findById(id: string): Promise<RoomEntity | null>;
}
