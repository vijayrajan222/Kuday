
import type { VerifyResetOtpRequestDto, VerifyResetOtpResponseDto } from "@application/dto/auth/VerifyResetOtpDto"

export interface IVerifyResetOtpUseCase {
    execute(dto:VerifyResetOtpRequestDto): Promise<VerifyResetOtpResponseDto>
}