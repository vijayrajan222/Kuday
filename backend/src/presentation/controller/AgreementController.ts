import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@presentation/middleware/AuthMiddleware";
import type { IAgreementController } from "@presentation/interface/IAgreementController";
import type { ICreateOrGetAgreementUseCase } from "@application/interfaces/use-case/agreement/ICreateOrGetAgreementUseCase";
import type { IGetAgreementUseCase } from "@application/interfaces/use-case/agreement/IGetAgreementUseCase";
import type { ICheckAgreementUnlockUseCase } from "@application/interfaces/use-case/agreement/ICheckAgreementUnlockUseCase";
import type { IUpdateCommonTermsUseCase } from "@application/interfaces/use-case/agreement/IUpdateCommonTermsUseCase";
import type { IDraftClauseUseCase } from "@application/interfaces/use-case/agreement/IDraftClauseUseCase";
import type { IProposeCustomClauseUseCase } from "@application/interfaces/use-case/agreement/IProposeCustomClauseUseCase";
import type { IRespondCustomClauseUseCase } from "@application/interfaces/use-case/agreement/IRespondCustomClauseUseCase";
import type { ICreateAgreementPaymentOrderUseCase } from "@application/interfaces/use-case/agreement/ICreateAgreementPaymentOrderUseCase";
import type { IVerifyAgreementPaymentUseCase } from "@application/interfaces/use-case/agreement/IVerifyAgreementPaymentUseCase";
import type { IHandleAgreementWebhookUseCase } from "@application/interfaces/use-case/agreement/IHandleAgreementWebhookUseCase";
import type { ISignAgreementUseCase } from "@application/interfaces/use-case/agreement/ISignAgreementUseCase";
import type { IGetAgreementPdfUseCase } from "@application/interfaces/use-case/agreement/IGetAgreementPdfUseCase";
import {
    createAgreementSchema,
    checkUnlockSchema,
    proposeCommonTermsSchema,
    respondCommonTermsSchema,
    draftClauseSchema,
    proposeCustomClauseSchema,
    respondCustomClauseSchema,
    verifyAgreementPaymentSchema,
} from "@presentation/utils/validators/zod/AgreementSchema";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";
import { UnauthorizedError } from "@application/errors/AppError";

export class AgreementController implements IAgreementController {
    constructor(
        private readonly createOrGetAgreementUseCase: ICreateOrGetAgreementUseCase,
        private readonly getAgreementUseCase: IGetAgreementUseCase,
        private readonly checkUnlockUseCase: ICheckAgreementUnlockUseCase,
        private readonly updateCommonTermsUseCase: IUpdateCommonTermsUseCase,
        private readonly draftClauseUseCase: IDraftClauseUseCase,
        private readonly proposeCustomClauseUseCase: IProposeCustomClauseUseCase,
        private readonly respondCustomClauseUseCase: IRespondCustomClauseUseCase,
        private readonly createAgreementPaymentOrderUseCase: ICreateAgreementPaymentOrderUseCase,
        private readonly verifyAgreementPaymentUseCase: IVerifyAgreementPaymentUseCase,
        private readonly handleAgreementWebhookUseCase: IHandleAgreementWebhookUseCase,
        private readonly signAgreementUseCase: ISignAgreementUseCase,
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

    checkUnlock = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validated = checkUnlockSchema.parse({
                hostId: req.query.hostId,
                seekerId: req.query.seekerId,
                roomId: req.query.roomId,
            });

            const status = await this.checkUnlockUseCase.execute(
                validated.hostId,
                validated.seekerId,
                validated.roomId
            );

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(status, "Agreement unlock status evaluated.")
            );
        } catch (err) {
            next(err);
        }
    };

    proposeTerms = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const validated = proposeCommonTermsSchema.parse(req.body);

            const updated = await this.updateCommonTermsUseCase.propose({
                agreementId,
                userId,
                terms: validated.terms,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(updated, "Proposed new common terms successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    respondTerms = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const validated = respondCommonTermsSchema.parse(req.body);

            const updated = await this.updateCommonTermsUseCase.respond({
                agreementId,
                userId,
                action: validated.action,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(updated, `Successfully ${validated.action}ed proposed terms.`)
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

    proposeClause = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const validated = proposeCustomClauseSchema.parse(req.body);

            const agreement = await this.proposeCustomClauseUseCase.execute(userId, agreementId, {
                originalText: validated.originalText,
                aiDraftText: validated.aiDraftText,
                finalText: validated.finalText,
            });

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(agreement, "Custom clause proposed successfully.")
            );
        } catch (err) {
            next(err);
        }
    };

    respondClause = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const clauseId = req.params.clauseId as string;
            const validated = respondCustomClauseSchema.parse(req.body);

            const agreement = await this.respondCustomClauseUseCase.execute(
                userId,
                agreementId,
                clauseId,
                {
                    action: validated.action,
                    counterText: validated.counterText,
                }
            );

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, `Custom clause response recorded (${validated.action}).`)
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
                ApiResponse.success(agreement, "Payment verified successfully. Ready to sign!")
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

    sign = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new UnauthorizedError("Authentication required.");

            const agreementId = req.params.id as string;
            const clientIp =
                (req.headers["x-forwarded-for"] as string) ||
                req.socket.remoteAddress ||
                req.ip ||
                "127.0.0.1";

            const agreement = await this.signAgreementUseCase.execute(userId, agreementId, clientIp);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(agreement, "Agreement signed successfully.")
            );
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
