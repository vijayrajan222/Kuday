import type { UserEntity } from "../../../domain/entities/UserEntity.js";
import type { SignUpUserRequestDto, SignUpUserResultDTO } from "../../dto/auth/SignUpDTO.js";
import type { IOtpRepository } from "../../interfaces/repository/IOtpRepository.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IHashingService } from "../../interfaces/services/IhashingService.js";
import type { IMailService } from "../../interfaces/services/IMailServices.js";
import type { IOtpService } from "../../interfaces/services/IOtpServices.js";
import type { ISignUpUserUsercase } from "../../interfaces/use-case/auth/ISignUpUserUsecase.js";

export class SignUpUserUseCase implements ISignUpUserUsercase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _hashService: IHashingService,
        private readonly _otpRepo: IOtpRepository,
        private readonly _otpService: IOtpService,
        private readonly _mailService: IMailService
    ) {}

    async execute(dto: SignUpUserRequestDto): Promise<SignUpUserResultDTO> {
        // 1. Password confirmation check
        if (dto.confirmPassword !== dto.password) {
            throw new Error("The passwords do not match.");
        }

        // 2. Normalize email input
        const cleanedEmail = dto.email.trim().toLowerCase();

        // 3. Hash password
        const hashedPassword = await this._hashService.hash(dto.password);

        let userId: string;

        // 4. Check if user already exists
        const existingUser = await this._userRepo.findByEmail(cleanedEmail);

        if (existingUser) {
            // Edge Case A: User exists and is ALREADY verified
            if (existingUser.isVerified) {
                throw new Error("User with this email already exists.");
            }

            // Edge Case B: User exists but is UNVERIFIED
            // Reuse existing user ID and clean up old OTPs to prevent duplicates
            userId = existingUser.id;
            await this._otpRepo.deleteByEmail(cleanedEmail);
        } else {
            // Brand New User: Create and save to DB
            const newUser: Omit<UserEntity, "id"> = {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                email: cleanedEmail,
                isVerified: false,
                isBlocked: false,
                hashedPassword: hashedPassword,
            };

            const savedUser = await this._userRepo.save(newUser);
            userId = savedUser.id;
        }

        // 5. Generate 6-digit OTP code & calculate 10-minute expiry
        const otpCode = this._otpService.generateOtp(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 6. Save new OTP to database
        await this._otpRepo.save({
            email: cleanedEmail,
            otp: otpCode,
            expiresAt: expiresAt,
        });

        // 7. Dispatch real email via Nodemailer & log in terminal for quick dev testing
        console.log(`\n========================================`);
        console.log(`🔑 [OTP DEBUG] Verification OTP Code for ${cleanedEmail}: ${otpCode}`);
        console.log(`========================================\n`);

        try {
            await this._mailService.sendOtpEmail(cleanedEmail, otpCode);
        } catch (mailError: any) {
            console.error("Failed to send OTP email via Nodemailer:", mailError.message || mailError);
        }

        // 8. Return result DTO
        return {
            id: userId,
            email: cleanedEmail,
        };
    }
}