import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IResetPasswordUseCase } from "@application/interfaces/use-case/auth/IResetPasswordUseCase";
import type { IHashingService } from "@application/interfaces/services/IhashingService";
import type { ResetPasswordRequestDto, ResetPasswordResponseDto } from "@application/dto/auth/ResetPasswordDto";

export class ResetPasswordUseCase implements IResetPasswordUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _hashService: IHashingService,
    ) { }
    async execute(dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {

        const cleanedEmail = dto.email.trim().toLowerCase();

        const existingUser = await this._userRepo.findByEmail(cleanedEmail);


        if (dto.newPassword !== dto.confirmPassword) {
            throw new Error("Password Mismatch")
        }

        const hashedPassword = await this._hashService.hash(dto.newPassword);
         const savedUser = await this._userRepo.updatenewPassword(cleanedEmail,hashedPassword);
          


        return {
            email:cleanedEmail,
            message: "New Password Updated successfully.",
        };
    }
} 