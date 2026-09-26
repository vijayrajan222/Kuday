import type { VerifyOtpRequestDto,VerifyOtpResultDto } from "../../../dto/auth/VerifyOtpDto.js"

export interface IVerifyOtpUseCase {
    exicute(dto:VerifyOtpRequestDto): Promise<VerifyOtpResultDto>
}