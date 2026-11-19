import { Router, type RequestHandler } from "express";
import type { IAgreementController } from "@presentation/interface/IAgreementController";
import {
    aiClausePerMinuteLimiter,
    aiClausePerDayLimiter,
} from "@presentation/middleware/AiClauseRateLimiter";

export function createAgreementRouter(
    agreementController: IAgreementController,
    authMiddleware: RequestHandler
): Router {
    const router = Router();

    // Webhook route (external callback, unauthenticated signature-verified)
    router.post("/payment/webhook", agreementController.handleWebhook as RequestHandler);

    // All subsequent agreement routes require authentication
    router.use(authMiddleware);

    // 1. Create or fetch active agreement for match (validates match only)
    router.post("/", agreementController.createOrGet as RequestHandler);

    // Active roommate details (MUST precede /:id)
    router.get("/roommate", agreementController.getActiveRoommate as RequestHandler);

    // 2. Get agreement by ID
    router.get("/:id", agreementController.getById as RequestHandler);

    // 3. Turn-based Editing Lock
    router.post("/:id/lock", agreementController.acquireLock as RequestHandler);
    router.post("/:id/heartbeat", agreementController.renewLockHeartbeat as RequestHandler);
    router.post("/:id/unlock", agreementController.releaseLock as RequestHandler);

    // 4. Submit proposal for review
    router.post("/:id/submit", agreementController.submitProposal as RequestHandler);

    // 5. Accept proposal
    router.post("/:id/accept", agreementController.acceptProposal as RequestHandler);

    // 6. Draft custom clause with AI (preview only, rate-limited)
    router.post(
        "/:id/clauses/draft",
        aiClausePerMinuteLimiter as unknown as RequestHandler,
        aiClausePerDayLimiter as unknown as RequestHandler,
        agreementController.draftClause as RequestHandler
    );

    // 7. Payment: create order (seeker only, checks fee / subscription waiver)
    router.post("/:id/payment/order", agreementController.createPaymentOrder as RequestHandler);

    // 8. Payment: verify transaction (server-side verification)
    router.post("/:id/payment/verify", agreementController.verifyPayment as RequestHandler);

    // 9. Download final agreement PDF
    router.get("/:id/pdf", agreementController.getPdf as RequestHandler);

    // 10. End / Cancel agreement
    router.post("/:id/terminate", agreementController.terminate as RequestHandler);

    return router;
}
