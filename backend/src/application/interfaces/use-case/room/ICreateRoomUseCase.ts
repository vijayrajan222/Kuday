import type { RoomEntity } from "@domain/entities/RoomEntity.js";
import type { CreateRoomDto } from "@application/dto/room/CreateRoomDto.js";

export interface ICreateRoomUseCase {
    execute(dto: CreateRoomDto): Promise<RoomEntity>;
}
