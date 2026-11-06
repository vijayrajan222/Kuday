import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IUploadIdentityUseCase } from "@application/interfaces/use-case/user/IUploadIdentityUseCase";
import type { UploadIdentityDto } from "@application/dto/user/UploadIdentityDto";
import type { UserEntity } from "@domain/entities/UserEntity";
import type { ICloudinaryService } from "@application/interfaces/services/ICloudinaryService";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";

export class UploadIdentityUseCase implements IUploadIdentityUseCase {
    constructor(
        private userRepository: IUserRepository,
        private cloudinaryService: ICloudinaryService,
        private notificationRepository?: INotificationRepository
    ) {}

    async execute(dto: UploadIdentityDto): Promise<UserEntity> {
        const user = await this.userRepository.findById(dto.userId);
        if (!user) {
            throw new Error("User not found");
        }

        const idCardUrl = await this.cloudinaryService.uploadImage(dto.idCardBase64, "kuday_identity_cards");
        const selfieUrl = await this.cloudinaryService.uploadImage(dto.selfieBase64, "kuday_selfies");

        // Set identityVerified to false and identityStatus to pending so Admin must review & approve
        const updatedUser = await this.userRepository.updateProfile(dto.userId, {
            idCardUrl,
            selfieUrl,
            identityVerified: false,
            identityStatus: "pending",
        });

        if (!updatedUser) {
            throw new Error("Failed to save identity verification documents");
        }

        if (this.notificationRepository) {
            await this.notificationRepository.create({
                userId: dto.userId,
                title: "Identity Documents Submitted 📄",
                message: "Your identity verification documents (ID Card & Selfie) have been submitted and are pending admin review.",
                type: "admin_verification",
                isRead: false,
            });
        }

        return updatedUser;
    }
}
