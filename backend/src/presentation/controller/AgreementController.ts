import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@presentation/middleware/AuthMiddleware";
import type { IAgreementController } from "@presentation/interface/IAgreementController";
import type { ICreateOrGetAgreementUseCase } from "@application/interfaces/use-case/agreement/ICreateOrGetAgreementUseCase";
import type { IGetAgreementUseCase } from "@application/interfaces/use-case/agreement/IGetAgreementUseCase";
import type { IAcquireAgreementLockUseCase } from "@application/interfaces/use-case/agreement/IAcquireAgreementLockUseCase";
import type { IHeartbeatAgreementLockUseCase } from "@application/interfaces/use-case/agreement/IHeartbeatAgreementLockUseCase";
import type { IReleaseAgreementLockUseCase } from "@application/interfaces/use-case/agreement/IReleaseAgreementLockUseCase";
import type { ISubmitAgreementProposalUseCase } from "@application/interfaces/use-case/agreement/ISubmitAgreementProposalUseCase";
import type { IAcceptAgreementProposalUseCase } from "@application/interfaces/use-case/agreement/IAcceptAgreementProposalUseCase";
import type { IDraftClauseUseCase } from "@application/interfaces/use-case/agreement/IDraftClauseUseCase";
import type { ICreateAgreementPaymentOrderUseCase } from "@application/interfaces/use-case/agreement/ICreateAgreementPaymentOrderUseCase";
import type { IVerifyAgreementPaymentUseCase } from "@application/interfaces/use-case/agreement/IVerifyAgreementPaymentUseCase";
import type { IHandleAgreementWebhookUseCase } from "@application/interfaces/use-case/agreement/IHandleAgreementWebhookUseCase";
import type { IGetAgreementPdfUseCase } from "@application/interfaces/use-case/agreement/IGetAgreementPdfUseCase";
import {
    createAgreementSchema,
    submitAgreementProposalSchema,
    acceptAgreementProposalSchema,
    draftClauseSchema,
    verifyAgreementPaymentSchema,
} from "@presentation/utils/validators/zod/AgreementSchema";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";
import { UnauthorizedError } from "@application/errors/AppError";

export class AgreementController implements IAgreementController {
    constructor(
        private readonly createOrGetAgreementUseCase: ICreateOrGetAgreementUseCase,
        private readonly getAgreementUseCase: IGetAgreementUseCase,
        private readonly acquireAgreementLockUseCase: IAcquireAgreementLockUseCase,
        private readonly heartbeatAgreementLockUseCase: IHeartbeatAgreementLockUseCase,
        private readonly releaseAgreementLockUseCase: IReleaseAgreementLockUseCase,
        private readonly submitAgreementProposalUseCase: ISubmitAgreementProposalUseCase,
        private readonly acceptAgreementProposalUseCase: IAcceptAgreementProposalUseCase,
        private readonly draftClauseUseCase: IDraftClauseUseCase,
        private readonly createAgreementPaymentOrderUseCase: ICreateAgreementPaymentOrderUseCase,
        private readonly verifyAgreementPaymentUseCase: IVerifyAgreementPaymentUseCase,
        private readonly handleAgreementWebhookUseCase: IHandleAgreementWebhookUseCase,
        private readonly getAgreementPdfUseCase: IGetAgreementPdfUseCase
    ) {}

    createOrGet = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const validated = createAgreementSchema.parse(req.body);
            const agreement = await this.createOrGetAgreementUseCase.execute(validated, userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Agreement retrieved or created successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const agreement = await this.getAgreementUseCase.execute(agreementId, userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Agreement fetched successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    acquireLock = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const agreement = await this.acquireAgreementLockUseCase.execute(agreementId, userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Edit lock acquired successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    renewLockHeartbeat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const agreement = await this.heartbeatAgreementLockUseCase.execute(agreementId, userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Lock heartbeat renewed successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    releaseLock = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const agreement = await this.releaseAgreementLockUseCase.execute(agreementId, userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Edit lock released successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    submitProposal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const validated = submitAgreementProposalSchema.parse(req.body);

            const agreement = await this.submitAgreementProposalUseCase.execute(
                agreementId,
                userId,
                {
                    revision: validated.revision,
                    commonTerms: validated.commonTerms,
                    customClauses: validated.customClauses?.map((c) => ({
                        id: c.id || "",
                        proposedBy: c.proposedBy,
                        originalText: c.originalText,
                        aiDraftText: c.aiDraftText,
                        finalText: c.finalText,
                        status: c.status,
                        createdAt: c.createdAt,
                    })),
                }
            );

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Proposal submitted for review successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    acceptProposal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const validated = acceptAgreementProposalSchema.parse(req.body);

            const agreement = await this.acceptAgreementProposalUseCase.execute(
                agreementId,
                userId,
                validated.revision
            );

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Proposal accepted successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    draftClause = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const validated = draftClauseSchema.parse(req.body);

            const result = await this.draftClauseUseCase.execute(userId, agreementId, validated.userNeed);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Clause preview generated.")
            );
        } catch (err) {
            next(err);
        }
    };

    createPaymentOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const result = await this.createAgreementPaymentOrderUseCase.execute(userId, agreementId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.waived ? "Agreement fee waived." : "Payment order created.")
            );
        } catch (err) {
            next(err);
        }
    };

    verifyPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const validated = verifyAgreementPaymentSchema.parse(req.body);

            const agreement = await this.verifyAgreementPaymentUseCase.execute(userId, agreementId, {
                orderId: validated.orderId,
                paymentId: validated.paymentId,
                signature: validated.signature,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Payment verified successfully. Agreement finalized!")
            );
        } catch (err) {
            next(err);
        }
    };

    handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const signature = (req.headers["x-razorpay-signature"] as string) || "";
            const rawBody = (req as unknown as { rawBody?: string }).rawBody || JSON.stringify(req.body);

            const result = await this.handleAgreementWebhookUseCase.execute(rawBody, signature, req.body);
            res.status(HttpStatusCodes.OK).json(result);
        } catch (err) {
            next(err);
        }
    };

    getPdf = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const { buffer, fileName } = await this.getAgreementPdfUseCase.execute(userId, agreementId);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            res.setHeader("Content-Length", buffer.length);
            res.send(buffer);
        } catch (err) {
            next(err);
        }
    };
}
