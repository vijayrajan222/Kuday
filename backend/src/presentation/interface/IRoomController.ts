import type { Request, Response } from "express";

export interface IRoomController {
    createRoom(req: Request, res: Response): Promise<void>;
    getRooms(req: Request, res: Response): Promise<void>;
}
