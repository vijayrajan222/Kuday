import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { INotificationRepository } from "../../interfaces/repository/INotificationRepository.js";
import type { IVerifyUserIdentityUseCase } from "../../interfaces/use-case/admin/IVerifyUserIdentityUseCase.js";
import type { VerifyUserIdentityRequestDto, VerifyUserIdentityResultDto } from "../../dto/admin/VerifyUserIdentityDto.js";

// Backward-compatibility alias
export type VerifyUserIdentityInput = VerifyUserIdentityRequestDto;

export class VerifyUserIdentityUseCase implements IVerifyUserIdentityUseCase {
    constructor(
        private userRepository: IUserRepository,
        private notificationRepository: INotificationRepository
    ) {}

    async execute(input: VerifyUserIdentityRequestDto): Promise<VerifyUserIdentityResultDto> {
        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            throw new Error("User not found.");
        }

        if (input.action === "approve") {
            await this.userRepository.updateUser(input.userId, {
                identityVerified: true,
                identityStatus: "verified",
                rejectionReason: "",
            });

            await this.notificationRepository.create({
                userId: input.userId,
                title: "Identity Verified 🎉",
                message: "Congratulations! Your identity documents (Selfie & ID) have been verified by the Admin.",
                type: "admin_verification",
                isRead: false,
            });

            return { message: "User identity approved and verified.", identityStatus: "verified" };
        } else {
            const reason = input.rejectionReason || "Uploaded documents do not meet verification criteria.";
            await this.userRepository.updateUser(input.userId, {
                identityVerified: false,
                identityStatus: "rejected",
                rejectionReason: reason,
            });

            await this.notificationRepository.create({
                userId: input.userId,
                title: "Identity Verification Action Required ⚠️",
                message: `Your identity verification request was rejected: ${reason}`,
                type: "admin_verification",
                isRead: false,
            });

            return { message: "User identity rejected.", identityStatus: "rejected" };
        }
    }
}
