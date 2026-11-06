import { Router } from "express";
import type { Request, Response } from "express";
import type { IRoomController } from "@presentation/interface/IRoomController";

export function createRoomRouter(roomController: IRoomController): Router {
    const router = Router();

    router.post("/", async (req: Request, res: Response) => {
        return await roomController.createRoom(req, res);
    });

    router.get("/", async (req: Request, res: Response) => {
        return await roomController.getRooms(req, res);
    });

    return router;
}
