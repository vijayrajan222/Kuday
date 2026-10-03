import { Router } from "express";
import type { UserController } from "../controller/UserController.js";

export const createUserRouter = (userController: UserController): Router => {
    const router = Router();
    router.get("/:userId", (req, res) => userController.getUserProfile(req, res));
    router.patch("/:userId/profile", (req, res) => userController.updateProfile(req, res));
    router.patch("/:userId/role", (req, res) => userController.updateRole(req, res));
    router.post("/:userId/identity", (req, res) => userController.uploadIdentity(req, res));
    return router;
};
