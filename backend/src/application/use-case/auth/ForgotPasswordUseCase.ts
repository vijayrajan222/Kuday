import type { ForgotPasswordRequestDto , ForgotPasswordResposeDto } from "../../dto/auth/ForgotPasswordDto.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IOtpService } from "../../interfaces/services/IOtpServices.js";
import type { IOtpRepository } from "../../interfaces/repository/IOtpRepository.js";
import type { IMailService } from "../../interfaces/services/IMailServices.js";
import type { IForgotPasswordUseCase } from "../../interfaces/use-case/auth/IForgotPasswordUseCase.js";

export class ForgotPasswordUseCase implements IForgotPasswordUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _otpService : IOtpService,
        private readonly _otpRepo : IOtpRepository,
        private readonly _mailService : IMailService


    ) { }

    async execute(dto: ForgotPasswordRequestDto ): Promise<ForgotPasswordResposeDto> {
        const cleanedEmail = dto.email.trim().toLowerCase()
        const existingUser = await this._userRepo.findByEmail(cleanedEmail);
        if (!existingUser) {
            throw new Error("User doesnot Exist")

        }
        if (!existingUser.isVerified) {
            throw new Error("Please verify your email address before logging in.");
        }
        if (existingUser.isBlocked) {
            throw new Error("Your account has been blocked. Please contact support.");
        }

         const otpCode = this._otpService.generateOtp(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 6. Save new OTP to database
        await this._otpRepo.save({
            email: cleanedEmail,
            otp: otpCode,
            expiresAt: expiresAt,
        });

        // 7. Dispatch real email via Nodemailer
        await this._mailService.sendOtpEmail(cleanedEmail, otpCode);

        // 8. Return result DTO
        return {
            email: cleanedEmail,
            message : "Otp sent to the email id please varify to continue."
        };

    }



}