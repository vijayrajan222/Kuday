import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IUpdateProfileUseCase } from "@application/interfaces/use-case/user/IUpdateProfileUseCase";
import type { IUploadIdentityUseCase } from "@application/interfaces/use-case/user/IUploadIdentityUseCase";
import type { IUpdateRoleUseCase } from "@application/interfaces/use-case/user/IUpdateRoleUseCase";
import type { IGetUserProfileUseCase } from "@application/interfaces/use-case/user/IGetUserProfileUseCase";
import type { IChangePasswordUseCase } from "@application/interfaces/use-case/user/IChangePasswordUseCase";
import type { IUserController } from "@presentation/interface/IUserController";
import { UpdateProfileSchema } from "@presentation/utils/validators/zod/UpdateProfileSchema";
import { ChangePasswordSchema } from "@presentation/utils/validators/zod/ChangePasswordSchema";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export class UserController implements IUserController {
    constructor(
        private updateProfileUseCase: IUpdateProfileUseCase,
        private uploadIdentityUseCase: IUploadIdentityUseCase,
        private updateRoleUseCase: IUpdateRoleUseCase,
        private getUserProfileUseCase: IGetUserProfileUseCase,
        private changePasswordUseCase: IChangePasswordUseCase
    ) {}

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const validatedData = UpdateProfileSchema.parse(req.body);

            const user = await this.updateProfileUseCase.execute({
                userId,
                ...validatedData,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(user, "Profile updated successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to update profile")
            );
        }
    }

    async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const { role } = req.body;

            if (!role || (role !== "host" && role !== "seeker")) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("Valid role ('host' or 'seeker') is required")
                );
                return;
            }

            const user = await this.updateRoleUseCase.execute({ userId, role });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(user, "Role updated successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to update role")
            );
        }
    }

    async uploadIdentity(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const { idCardBase64, selfieBase64 } = req.body;

            if (!idCardBase64 || !selfieBase64) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("Both ID Card image and Selfie image are required.")
                );
                return;
            }

            const user = await this.uploadIdentityUseCase.execute({
                userId,
                idCardBase64,
                selfieBase64,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(user, "Identity verification documents uploaded successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to upload identity verification documents")
            );
        }
    }

    async getUserProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const user = await this.getUserProfileUseCase.execute(userId);

            if (!user) {
                res.status(HttpStatusCodes.NOT_FOUND).json(
                    ApiResponse.error("User not found", HttpStatusCodes.NOT_FOUND)
                );
                return;
            }

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(user, "User profile fetched successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to fetch user profile")
            );
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const validatedData = ChangePasswordSchema.parse(req.body);

            const result = await this.changePasswordUseCase.execute({
                userId,
                currentPassword: validatedData.currentPassword,
                newPassword: validatedData.newPassword,
                confirmPassword: validatedData.confirmPassword,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error(error.issues[0]?.message ?? "Invalid password data")
                );
                return;
            }
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Failed to change password")
            );
        }
    }
}
