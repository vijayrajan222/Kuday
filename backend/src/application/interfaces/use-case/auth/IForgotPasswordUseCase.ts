import type { ForgotPasswordRequestDto , ForgotPasswordResposeDto  } from "../../../dto/auth/ForgotPasswordDto.js";

export interface IForgotPasswordUseCase {
    execute(dto:ForgotPasswordRequestDto ):Promise<ForgotPasswordResposeDto >
}