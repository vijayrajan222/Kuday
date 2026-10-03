import type { Request, Response } from "express";
import type { AdminLoginUseCase } from "../../application/use-case/admin/AdminLoginUseCase.js";
import type { GetAdminStatsUseCase } from "../../application/use-case/admin/GetAdminStatsUseCase.js";
import type { GetAllUsersUseCase } from "../../application/use-case/admin/GetAllUsersUseCase.js";
import type { VerifyUserIdentityUseCase } from "../../application/use-case/admin/VerifyUserIdentityUseCase.js";
import type { ToggleBlockUserUseCase } from "../../application/use-case/admin/ToggleBlockUserUseCase.js";

export class AdminController {
    constructor(
        private adminLoginUseCase: AdminLoginUseCase,
        private getAdminStatsUseCase: GetAdminStatsUseCase,
        private getAllUsersUseCase: GetAllUsersUseCase,
        private verifyUserIdentityUseCase: VerifyUserIdentityUseCase,
        private toggleBlockUserUseCase: ToggleBlockUserUseCase
    ) {}

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: "Email and password are required." });
                return;
            }
            const result = await this.adminLoginUseCase.execute({ email, password });
            res.status(200).json({ success: true, data: result });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Admin login failed.";
            res.status(401).json({ success: false, message: msg });
        }
    }

    async getStats(_req: Request, res: Response): Promise<void> {
        try {
            const stats = await this.getAdminStatsUseCase.execute();
            res.status(200).json({ success: true, data: stats });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch admin stats.";
            res.status(500).json({ success: false, message: msg });
        }
    }

    async getUsers(_req: Request, res: Response): Promise<void> {
        try {
            const users = await this.getAllUsersUseCase.execute();
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
            res.status(200).json({ success: true, data: mappedUsers });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch users.";
            res.status(500).json({ success: false, message: msg });
        }
    }

    async verifyIdentity(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const { action, rejectionReason } = req.body;
            if (!action || (action !== "approve" && action !== "reject")) {
                res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'." });
                return;
            }
            const result = await this.verifyUserIdentityUseCase.execute({ userId, action, rejectionReason });
            res.status(200).json({ success: true, data: result });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to verify user identity.";
            res.status(500).json({ success: false, message: msg });
        }
    }

    async toggleBlock(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const result = await this.toggleBlockUserUseCase.execute(userId);
            res.status(200).json({ success: true, data: result });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to toggle block status.";
            res.status(500).json({ success: false, message: msg });
        }
    }
}
