import type { ResetPasswordRequestDto, ResetPasswordResponseDto } from "@application/dto/auth/ResetPasswordDto.js";

export interface IResetPasswordUseCase  {
    execute(dto:ResetPasswordRequestDto):Promise<ResetPasswordResponseDto>
   
}