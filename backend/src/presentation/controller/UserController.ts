import type { Request, Response } from "express";
import type { IUpdateProfileUseCase } from "../../application/interfaces/use-case/user/IUpdateProfileUseCase.js";
import type { IUploadIdentityUseCase } from "../../application/interfaces/use-case/user/IUploadIdentityUseCase.js";
import type { IUserRepository } from "../../application/interfaces/repository/IUserRepository.js";
import { UpdateProfileSchema } from "../utils/validators/zod/UpdateProfileSchema.js";

export class UserController {
    constructor(
        private updateProfileUseCase: IUpdateProfileUseCase,
        private uploadIdentityUseCase: IUploadIdentityUseCase,
        private userRepository: IUserRepository
    ) {}

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const validatedData = UpdateProfileSchema.parse(req.body);

            const user = await this.updateProfileUseCase.execute({
                userId,
                ...validatedData
            });

            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: user
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || "Failed to update profile"
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
                    message: "Both ID Card image and Selfie image are required."
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
                message: "Identity verification and onboarding completed successfully",
                data: user
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || "Failed to upload identity verification documents"
            });
        }
    }

    async getUserProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const user = await this.userRepository.findById(userId);

            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || "Failed to fetch user profile"
            });
        }
    }
}
