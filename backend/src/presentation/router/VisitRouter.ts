import { Router } from "express";
import type { IVisitController } from "@presentation/interface/IVisitController";

export function createVisitRouter(visitController: IVisitController): Router {
    const router = Router();

    router.post("/", visitController.createVisit);
    router.get("/connection/:connectionId", visitController.getVisitsByConnection);
    router.get("/user/:userId", visitController.getVisitsByUser);
    router.patch("/:visitId/status", visitController.updateVisitStatus);
    router.patch("/:visitId/suggest", visitController.suggestVisitChanges);
    router.patch("/:visitId/accept-suggestion", visitController.acceptVisitSuggestion);

    return router;
}
