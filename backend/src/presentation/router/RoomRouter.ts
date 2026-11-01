import { Router } from "express";
import type { IRoomController } from "../interface/IRoomController.js";

export function createRoomRouter(roomController: IRoomController): Router {
    const router = Router();
    router.post("/", (req, res) => roomController.createRoom(req, res));
    router.get("/", (req, res) => roomController.getRooms(req, res));
    return router;
}
