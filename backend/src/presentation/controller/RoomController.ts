import type { Request, Response } from "express";
import type { ICreateRoomUseCase } from "@application/interfaces/use-case/room/ICreateRoomUseCase";
import type { IGetRoomsUseCase } from "@application/interfaces/use-case/room/IGetRoomsUseCase";
import type { IRoomController } from "@presentation/interface/IRoomController";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export class RoomController implements IRoomController {
    constructor(
        private createRoomUseCase: ICreateRoomUseCase,
        private getRoomsUseCase: IGetRoomsUseCase
    ) {}

    async createRoom(req: Request, res: Response): Promise<void> {
        try {
            const room = await this.createRoomUseCase.execute(req.body);
            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(room, "Room created successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to create room")
            );
        }
    }

    async getRooms(req: Request, res: Response): Promise<void> {
        try {
            const hostId = req.query.hostId as string | undefined;
            const seekerUserId = (req.query.seekerUserId || req.query.userId) as string | undefined;

            const rooms = hostId
                ? await this.getRoomsUseCase.getByHostId(hostId)
                : await this.getRoomsUseCase.execute(seekerUserId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(rooms, "Rooms fetched successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch rooms")
            );
        }
    }

    async getRoomById(req: Request, res: Response): Promise<void> {
        try {
            const roomId = String(req.params.id || "");
            const seekerUserId = (req.query.seekerUserId || req.query.userId) as string | undefined;

            const room = await this.getRoomsUseCase.getById(roomId, seekerUserId);
            if (!room) {
                res.status(HttpStatusCodes.NOT_FOUND).json(
                    ApiResponse.error("Room not found")
                );
                return;
            }

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(room, "Room details fetched successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch room")
            );
        }
    }
}
