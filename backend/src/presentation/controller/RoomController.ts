import type { Request, Response } from "express";
import type { ICreateRoomUseCase } from "../../application/interfaces/use-case/room/ICreateRoomUseCase.js";
import type { IGetRoomsUseCase } from "../../application/interfaces/use-case/room/IGetRoomsUseCase.js";

export class RoomController {
    constructor(
        private createRoomUseCase: ICreateRoomUseCase,
        private getRoomsUseCase: IGetRoomsUseCase
    ) {}

    async createRoom(req: Request, res: Response): Promise<void> {
        try {
            const room = await this.createRoomUseCase.execute(req.body);
            res.status(201).json({
                success: true,
                message: "Room created successfully",
                data: room,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create room",
            });
        }
    }

    async getRooms(req: Request, res: Response): Promise<void> {
        try {
            const hostId = req.query.hostId as string | undefined;
            const seekerUserId = (req.query.seekerUserId || req.query.userId) as string | undefined;

            const rooms = hostId
                ? await this.getRoomsUseCase.getByHostId(hostId)
                : await this.getRoomsUseCase.execute(seekerUserId);

            res.status(200).json({
                success: true,
                data: rooms,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to fetch rooms",
            });
        }
    }
}
