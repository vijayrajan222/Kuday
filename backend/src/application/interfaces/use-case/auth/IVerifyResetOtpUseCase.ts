
import type { VerifyResetOtpRequestDto, VerifyResetOtpResponseDto } from "../../../dto/auth/VerifyResetOtpDto.js"

export interface IVerifyResetOtpUseCase {
    execute(dto:VerifyResetOtpRequestDto): Promise<VerifyResetOtpResponseDto>
}