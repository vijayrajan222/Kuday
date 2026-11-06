
import type { VerifyResetOtpRequestDto, VerifyResetOtpResponseDto } from "@application/dto/auth/VerifyResetOtpDto.js"

export interface IVerifyResetOtpUseCase {
    execute(dto:VerifyResetOtpRequestDto): Promise<VerifyResetOtpResponseDto>
}