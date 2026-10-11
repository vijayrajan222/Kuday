import type { VerifyOtpRequestDto,VerifyOtpResultDto } from "../../../dto/auth/VerifyOtpDto.js"

export interface IVerifyOtpUseCase {
    execute(dto:VerifyOtpRequestDto): Promise<VerifyOtpResultDto>
}