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

    // 1. Check if agreement flow is unlocked
    router.get("/unlock-status", agreementController.checkUnlock as RequestHandler);

    // 2. Create or fetch active agreement for match
    router.post("/", agreementController.createOrGet as RequestHandler);

    // 3. Get agreement by ID
    router.get("/:id", agreementController.getById as RequestHandler);

    // 4. Propose edits to common terms
    router.patch("/:id/common-terms", agreementController.proposeTerms as RequestHandler);
    router.patch("/:id/common-terms/propose", agreementController.proposeTerms as RequestHandler);

    // 5. Accept or reject proposed common terms
    router.patch("/:id/common-terms/respond", agreementController.respondTerms as RequestHandler);

    // 6. Draft custom clause with AI (preview only, rate-limited)
    router.post(
        "/:id/clauses/draft",
        aiClausePerMinuteLimiter as unknown as RequestHandler,
        aiClausePerDayLimiter as unknown as RequestHandler,
        agreementController.draftClause as RequestHandler
    );

    // 7. Submit confirmed custom clause as proposed
    router.post("/:id/clauses", agreementController.proposeClause as RequestHandler);

    // 8. Accept, reject, or counter a custom clause
    router.patch("/:id/clauses/:clauseId", agreementController.respondClause as RequestHandler);

    // 9. Payment: create order (seeker only, checks fee / premium waiver)
    router.post("/:id/payment/order", agreementController.createPaymentOrder as RequestHandler);

    // 10. Payment: verify transaction (server-side verification)
    router.post("/:id/payment/verify", agreementController.verifyPayment as RequestHandler);

    // 11. Dual party signing ("I agree and sign")
    router.post("/:id/sign", agreementController.sign as RequestHandler);

    // 12. Download final agreement PDF
    router.get("/:id/pdf", agreementController.getPdf as RequestHandler);

    return router;
}
