import { Router } from "express";
import type { Request, Response } from "express";
import type { IAdminController } from "@presentation/interface/IAdminController";

export function createAdminRouter(adminController: IAdminController): Router {
    const router = Router();

    router.post("/login", async (req: Request, res: Response) => {
        return await adminController.login(req, res);
    });

    router.get("/stats", async (req: Request, res: Response) => {
        return await adminController.getStats(req, res);
    });

    router.get("/users", async (req: Request, res: Response) => {
        return await adminController.getUsers(req, res);
    });

    router.patch("/users/:userId/verify-identity", async (req: Request, res: Response) => {
        return await adminController.verifyIdentity(req, res);
    });

    router.patch("/users/:userId/toggle-block", async (req: Request, res: Response) => {
        return await adminController.toggleBlock(req, res);
    });

    return router;
}
