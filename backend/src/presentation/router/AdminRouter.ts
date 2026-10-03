import { Router } from "express";
import type { AdminController } from "../controller/AdminController.js";

export const createAdminRouter = (adminController: AdminController): Router => {
    const router = Router();
    router.post("/login", (req, res) => adminController.login(req, res));
    router.get("/stats", (req, res) => adminController.getStats(req, res));
    router.get("/users", (req, res) => adminController.getUsers(req, res));
    router.patch("/users/:userId/verify-identity", (req, res) => adminController.verifyIdentity(req, res));
    router.patch("/users/:userId/toggle-block", (req, res) => adminController.toggleBlock(req, res));
    return router;
};
