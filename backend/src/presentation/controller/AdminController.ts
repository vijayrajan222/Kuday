import type { Request, Response } from "express";
import type { IAdminLoginUseCase } from "../../application/interfaces/use-case/admin/IAdminLoginUseCase.js";
import type { IGetAdminStatsUseCase } from "../../application/interfaces/use-case/admin/IGetAdminStatsUseCase.js";
import type { IGetAllUsersUseCase } from "../../application/interfaces/use-case/admin/IGetAllUsersUseCase.js";
import type { IVerifyUserIdentityUseCase } from "../../application/interfaces/use-case/admin/IVerifyUserIdentityUseCase.js";
import type { IToggleBlockUserUseCase } from "../../application/interfaces/use-case/admin/IToggleBlockUserUseCase.js";
import type { IAdminController } from "../interface/IAdminController.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { HttpStatusCodes } from "../utils/HttpStatusCodes.js";

export class AdminController implements IAdminController {
    constructor(
        private adminLoginUseCase: IAdminLoginUseCase,
        private getAdminStatsUseCase: IGetAdminStatsUseCase,
        private getAllUsersUseCase: IGetAllUsersUseCase,
        private verifyUserIdentityUseCase: IVerifyUserIdentityUseCase,
        private toggleBlockUserUseCase: IToggleBlockUserUseCase
    ) {}

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("Email and password are required.")
                );
                return;
            }
            const result = await this.adminLoginUseCase.execute({ email, password });
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Admin login successful")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Admin login failed.";
            res.status(HttpStatusCodes.UNAUTHORIZED).json(
                ApiResponse.error(msg, HttpStatusCodes.UNAUTHORIZED)
            );
        }
    }

    async getStats(_req: Request, res: Response): Promise<void> {
        try {
            const stats = await this.getAdminStatsUseCase.execute();
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(stats, "Admin stats fetched successfully")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch admin stats.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const users = await this.getAllUsersUseCase.execute(search);
            const mappedUsers = users.map((u) => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                role: u.role || "seeker",
                identityVerified: Boolean(u.identityVerified),
                identityStatus: u.identityStatus || "none",
                rejectionReason: u.rejectionReason,
                selfieUrl: u.selfieUrl,
                idCardUrl: u.idCardUrl,
                isBlocked: Boolean(u.isBlocked),
                isAdmin: Boolean(u.isAdmin),
            }));
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(mappedUsers, "Users fetched successfully")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch users.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async verifyIdentity(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const { action, rejectionReason } = req.body;
            if (!action || (action !== "approve" && action !== "reject")) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("Action must be 'approve' or 'reject'.")
                );
                return;
            }
            const result = await this.verifyUserIdentityUseCase.execute({ userId, action, rejectionReason });
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Identity verification updated successfully")
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to verify user identity.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }

    async toggleBlock(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const result = await this.toggleBlockUserUseCase.execute(userId);
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to toggle block status.";
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                ApiResponse.error(msg, HttpStatusCodes.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
