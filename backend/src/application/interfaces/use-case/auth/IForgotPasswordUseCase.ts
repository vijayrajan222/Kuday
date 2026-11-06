import type { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from "@application/dto/auth/ForgotPasswordDto";

export interface IForgotPasswordUseCase {
    execute(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto>;
}