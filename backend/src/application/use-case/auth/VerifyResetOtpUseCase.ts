import type { VerifyResetOtpRequestDto, VerifyResetOtpResponseDto } from "@application/dto/auth/VerifyResetOtpDto.js";
import type { IOtpRepository } from "@application/interfaces/repository/IOtpRepository.js";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import type { IJwtService } from "@application/interfaces/services/IJwtServices.js";
import type { IVerifyResetOtpUseCase } from "@application/interfaces/use-case/auth/IVerifyResetOtpUseCase.js";

export class VerifyResetOtpUseCase implements IVerifyResetOtpUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _otpRepo: IOtpRepository,
        private readonly _jwtService: IJwtService
    ) {}

    async execute(dto: VerifyResetOtpRequestDto): Promise<VerifyResetOtpResponseDto> {
        const cleanedEmail = dto.email.trim().toLowerCase();
        const user = await this._userRepo.findByEmail(cleanedEmail);

        if (!user) {
            throw new Error("User not found.");
        }

        // Fetch the latest OTP record for this email
        const latestOtp = await this._otpRepo.findLatestByEmail(cleanedEmail);
        if (!latestOtp) {
            throw new Error("No OTP found for the email. Please request a new one.");
        }

        if (new Date() > latestOtp.expiresAt) {
            throw new Error("OTP has expired, request a new one.");
        }

        if (latestOtp.otp.trim() !== dto.otp.trim()) {
            throw new Error("Invalid OTP code.");
        }

        await this._userRepo.updateVerificationStatus(cleanedEmail, true);
        await this._otpRepo.deleteByEmail(cleanedEmail);

        const token = this._jwtService.generateToken({ userId: user.id, email: user.email });

        return {
            email: cleanedEmail,
            message: "Email verification successful",
            isVerified: true,
            token: token,
        };
    }
}
