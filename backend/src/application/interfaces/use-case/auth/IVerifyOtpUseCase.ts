import type { VerifyOtpRequestDto,VerifyOtpResultDto } from "@application/dto/auth/VerifyOtpDto.js"

export interface IVerifyOtpUseCase {
    execute(dto:VerifyOtpRequestDto): Promise<VerifyOtpResultDto>
}