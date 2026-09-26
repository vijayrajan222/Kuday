import type { VerifyOtpRequestDto, VerifyOtpResultDto } from "../../dto/auth/VerifyOtpDto.js";
import type { IOtpRepository } from "../../interfaces/repository/IOtpRepository.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type {IVerifyOtpUseCase } from "../../interfaces/use-case/auth/IVerifyOtpUseCase.js";

export class VerifyOptUseCase implements IVerifyOtpUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _otpRepo: IOtpRepository
    ) {

    }
    async exicute(dto: VerifyOtpRequestDto): Promise<VerifyOtpResultDto> {
        const cleanedEmail = dto.email.trim().toLowerCase();

        const user = await this._userRepo.findByEmail(cleanedEmail)

        if (user?.isVerified) {
            return {
                message: "User is already verified",
                isVerified: true,
            }
        }

        //fetch the latest otp record for this email

        const latestOtp = await this._otpRepo.findLatestByEmail(cleanedEmail)
        if (!latestOtp) {
            throw new Error("No Otp found for the email, Please requrest a new one.")
        }

        if (new Date()>latestOtp.expiresAt){
            throw new Error("Otp has expired , request a new one.")
        }

        if (latestOtp.otp !== dto.otp){
            throw  new Error("Invalid OTP code.")
        }
        await this._userRepo.updateVerificationStatus(cleanedEmail,true)
         
        await this._otpRepo.deleteByEmail(cleanedEmail)

        return {
            message : "Email verification Successfully",
            isVerified : true
        }
    }
 
}