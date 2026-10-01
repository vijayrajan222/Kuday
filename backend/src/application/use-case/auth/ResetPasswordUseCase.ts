import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IResetPasswordUseCase } from "../../interfaces/use-case/auth/IResetPasswordUseCase.js";
import type { IHashingService } from "../../interfaces/services/IhashingService.js";
import type { ResetPasswordRequestDto, ResetPasswordResponseDto } from "../../dto/auth/ResetPasswordDto.js";

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