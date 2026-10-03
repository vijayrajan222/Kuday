import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IUploadIdentityUseCase } from "../../interfaces/use-case/user/IUploadIdentityUseCase.js";
import type { UploadIdentityDto } from "../../dto/user/UploadIdentityDto.js";
import type { UserEntity } from "../../../domain/entities/UserEntity.js";
import type { CloudinaryService } from "../../../infrastructure/services/CloudinaryService.js";

import type { INotificationRepository } from "../../interfaces/repository/INotificationRepository.js";

export class UploadIdentityUseCase implements IUploadIdentityUseCase {
    constructor(
        private userRepository: IUserRepository,
        private cloudinaryService: CloudinaryService,
        private notificationRepository?: INotificationRepository
    ) {}

    async execute(dto: UploadIdentityDto): Promise<UserEntity> {
        const user = await this.userRepository.findById(dto.userId);
        if (!user) {
            throw new Error("User not found");
        }

        const idCardUrl = await this.cloudinaryService.uploadImage(dto.idCardBase64, "kuday_identity_cards");
        const selfieUrl = await this.cloudinaryService.uploadImage(dto.selfieBase64, "kuday_selfies");

        const updatedUser = await this.userRepository.updateProfile(dto.userId, {
            idCardUrl,
            selfieUrl,
            identityVerified: true,
            isOnboarded: true,
        });

        if (!updatedUser) {
            throw new Error("Failed to save identity verification");
        }

        if (this.notificationRepository) {
            await this.notificationRepository.create({
                userId: dto.userId,
                title: "Identity Verified ✓",
                message: "Congratulations! Your identity verification documents (ID Card & Selfie) have been verified by Admin.",
                type: "admin_verification",
                isRead: false,
            });
        }

        return updatedUser;
    }
}
