import type { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from "@application/dto/auth/ForgotPasswordDto.js";

export interface IForgotPasswordUseCase {
    execute(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto>;
}