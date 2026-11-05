import type { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from "../../dto/auth/ForgotPasswordDto.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IOtpService } from "../../interfaces/services/IOtpServices.js";
import type { IOtpRepository } from "../../interfaces/repository/IOtpRepository.js";
import type { IMailService } from "../../interfaces/services/IMailServices.js";
import type { IForgotPasswordUseCase } from "../../interfaces/use-case/auth/IForgotPasswordUseCase.js";

export class ForgotPasswordUseCase implements IForgotPasswordUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _otpService: IOtpService,
        private readonly _otpRepo: IOtpRepository,
        private readonly _mailService: IMailService
    ) {}

    async execute(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
        const cleanedEmail = dto.email.trim().toLowerCase();
        const existingUser = await this._userRepo.findByEmail(cleanedEmail);
        if (!existingUser) {
            throw new Error("User with this email address does not exist.");
        }

        if (!existingUser.isVerified) {
            throw new Error("Please verify your email address before requesting a password reset.");
        }

        if (existingUser.isBlocked) {
            throw new Error("Your account has been blocked. Please contact support.");
        }

        // Clean up any existing OTPs for this email before generating a new one
        await this._otpRepo.deleteByEmail(cleanedEmail);

        const otpCode = this._otpService.generateOtp(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this._otpRepo.save({
            email: cleanedEmail,
            otp: otpCode,
            expiresAt: expiresAt,
        });

        try {
            await this._mailService.sendOtpEmail(cleanedEmail, otpCode);
        } catch (mailError: unknown) {
            await this._otpRepo.deleteByEmail(cleanedEmail);
            const errorMsg = mailError instanceof Error ? mailError.message : "Failed to deliver email";
            throw new Error(`Failed to send password reset email: ${errorMsg}. Please try again later.`);
        }

        return {
            email: cleanedEmail,
            message: "OTP sent to your email address.",
        };
    }
}