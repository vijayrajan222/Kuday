import { Router } from "express";
import type { RoomController } from "../controller/RoomController.js";

export const createRoomRouter = (roomController: RoomController): Router => {
    const router = Router();
    router.post("/", (req, res) => roomController.createRoom(req, res));
    router.get("/", (req, res) => roomController.getRooms(req, res));
    return router;
};
