import type { Request, Response } from "express";
import type { IUpdateProfileUseCase } from "../../application/interfaces/use-case/user/IUpdateProfileUseCase.js";
import type { IUploadIdentityUseCase } from "../../application/interfaces/use-case/user/IUploadIdentityUseCase.js";
import type { IUpdateRoleUseCase } from "../../application/interfaces/use-case/user/IUpdateRoleUseCase.js";
import type { IGetUserProfileUseCase } from "../../application/interfaces/use-case/user/IGetUserProfileUseCase.js";
import { UpdateProfileSchema } from "../utils/validators/zod/UpdateProfileSchema.js";

export class UserController {
    constructor(
        private updateProfileUseCase: IUpdateProfileUseCase,
        private uploadIdentityUseCase: IUploadIdentityUseCase,
        private updateRoleUseCase: IUpdateRoleUseCase,
        private getUserProfileUseCase: IGetUserProfileUseCase
    ) {}

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const validatedData = UpdateProfileSchema.parse(req.body);

            const user = await this.updateProfileUseCase.execute({
                userId,
                ...validatedData,
            });

            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: user,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to update profile",
            });
        }
    }

    async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const { role } = req.body;

            if (!role || (role !== "host" && role !== "seeker")) {
                res.status(400).json({
                    success: false,
                    message: "Valid role ('host' or 'seeker') is required",
                });
                return;
            }

            const user = await this.updateRoleUseCase.execute({ userId, role });

            res.status(200).json({
                success: true,
                message: "Role updated successfully",
                data: user,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to update role",
            });
        }
    }

    async uploadIdentity(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const { idCardBase64, selfieBase64 } = req.body;

            if (!idCardBase64 || !selfieBase64) {
                res.status(400).json({
                    success: false,
                    message: "Both ID Card image and Selfie image are required.",
                });
                return;
            }

            const user = await this.uploadIdentityUseCase.execute({
                userId,
                idCardBase64,
                selfieBase64,
            });

            res.status(200).json({
                success: true,
                message: "Identity verification documents uploaded successfully",
                data: user,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to upload identity verification documents",
            });
        }
    }

    async getUserProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const user = await this.getUserProfileUseCase.execute(userId);

            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to fetch user profile",
            });
        }
    }
}
