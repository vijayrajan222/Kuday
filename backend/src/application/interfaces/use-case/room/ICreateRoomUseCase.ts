import type { RoomEntity } from "@domain/entities/RoomEntity";
import type { CreateRoomDto } from "@application/dto/room/CreateRoomDto";

export interface ICreateRoomUseCase {
    execute(dto: CreateRoomDto): Promise<RoomEntity>;
}
