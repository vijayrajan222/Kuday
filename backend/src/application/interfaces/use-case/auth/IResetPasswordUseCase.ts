import type { ResetPasswordRequestDto, ResetPasswordResponseDto } from "../../../dto/auth/ResetPasswordDto.js";

export interface IResetPasswordUseCase  {
    execute(dto:ResetPasswordRequestDto):Promise<ResetPasswordResponseDto>
   
}