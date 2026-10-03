import type { IGetRoomsUseCase } from "../../interfaces/use-case/room/IGetRoomsUseCase.js";
import type { IRoomRepository } from "../../interfaces/repository/IRoomRepository.js";
import type { RoomEntity } from "../../../domain/entities/RoomEntity.js";

export class GetRoomsUseCase implements IGetRoomsUseCase {
    constructor(private roomRepository: IRoomRepository) {}

    async execute(): Promise<RoomEntity[]> {
        return this.roomRepository.findAll();
    }

    async getByHostId(hostId: string): Promise<RoomEntity[]> {
        return this.roomRepository.findByHostId(hostId);
    }
}
