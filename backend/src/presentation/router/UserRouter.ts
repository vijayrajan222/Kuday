import { Router } from "express";
import type { Request, Response } from "express";
import type { IUserController } from "../interface/IUserController.js";

export function createUserRouter(userController: IUserController): Router {
    const router = Router();

    router.get("/:userId", async (req: Request, res: Response) => {
        return await userController.getUserProfile(req, res);
    });

    router.patch("/:userId/profile", async (req: Request, res: Response) => {
        return await userController.updateProfile(req, res);
    });

    router.patch("/:userId/role", async (req: Request, res: Response) => {
        return await userController.updateRole(req, res);
    });

    router.post("/:userId/identity", async (req: Request, res: Response) => {
        return await userController.uploadIdentity(req, res);
    });

    router.patch("/:userId/change-password", async (req: Request, res: Response) => {
        return await userController.changePassword(req, res);
    });

    return router;
}
