import type { ChangePasswordRequestDto, ChangePasswordResponseDto } from "../../dto/user/ChangePasswordDto.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IHashingService } from "../../interfaces/services/IhashingService.js";
import type { IChangePasswordUseCase } from "../../interfaces/use-case/user/IChangePasswordUseCase.js";

export class ChangePasswordUseCase implements IChangePasswordUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _hashService: IHashingService
    ) {}

    async execute(dto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> {
        const user = await this._userRepo.findById(dto.userId);
        if (!user) {
            throw new Error("User not found.");
        }

        // If user already has a password set (standard email/password signup)
        if (user.hashedPassword && user.hashedPassword.trim() !== "") {
            if (!dto.currentPassword || dto.currentPassword.trim() === "") {
                throw new Error("Current password is required.");
            }

            const isCurrentValid = await this._hashService.compareHashes(
                dto.currentPassword,
                user.hashedPassword
            );

            if (!isCurrentValid) {
                throw new Error("Current password is incorrect.");
            }

            const isSamePassword = await this._hashService.compareHashes(
                dto.newPassword,
                user.hashedPassword
            );

            if (isSamePassword) {
                throw new Error("New password cannot be the same as your current password.");
            }
        }

        if (dto.newPassword !== dto.confirmPassword) {
            throw new Error("New passwords do not match.");
        }

        const newHashedPassword = await this._hashService.hash(dto.newPassword);
        await this._userRepo.updatenewPassword(user.email, newHashedPassword);

        return {
            message: "Password changed successfully.",
        };
    }
}
