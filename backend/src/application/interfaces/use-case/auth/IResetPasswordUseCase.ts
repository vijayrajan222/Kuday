import type { ResetPasswordRequestDto, ResetPasswordResponseDto } from "@application/dto/auth/ResetPasswordDto";

export interface IResetPasswordUseCase  {
    execute(dto:ResetPasswordRequestDto):Promise<ResetPasswordResponseDto>
   
}