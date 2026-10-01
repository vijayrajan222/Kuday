
import type { VerifyResetOtpRequestDto, VerifyResetOtpResponseDto } from "../../../dto/auth/VerifyResetOtpDto.js"

export interface IVerifyResetOtpUseCase {
    exicute(dto:VerifyResetOtpRequestDto): Promise<VerifyResetOtpResponseDto>
}