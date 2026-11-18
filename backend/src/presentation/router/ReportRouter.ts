import { Router } from "express";
import type { IReportController } from "@presentation/interface/IReportController";

export function createReportRouter(
    reportController: IReportController,
    authMiddleware?: any
): Router {
    const router = Router();

    if (authMiddleware) {
        router.post("/", authMiddleware, reportController.createReport);
        router.get("/", authMiddleware, reportController.getReports);
    } else {
        router.post("/", reportController.createReport);
        router.get("/", reportController.getReports);
    }

    return router;
}
