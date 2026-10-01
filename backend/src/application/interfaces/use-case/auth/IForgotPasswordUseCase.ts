import type { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from "../../../dto/auth/ForgotPasswordDto.js";

export interface IForgotPasswordUseCase {
    execute(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto>;
}