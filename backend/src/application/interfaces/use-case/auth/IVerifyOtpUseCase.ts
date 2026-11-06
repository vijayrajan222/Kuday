import type { VerifyOtpRequestDto,VerifyOtpResultDto } from "@application/dto/auth/VerifyOtpDto"

export interface IVerifyOtpUseCase {
    execute(dto:VerifyOtpRequestDto): Promise<VerifyOtpResultDto>
}