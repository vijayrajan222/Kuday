import type { ChangePasswordRequestDto, ChangePasswordResponseDto } from "@application/dto/user/ChangePasswordDto.js";

export interface IChangePasswordUseCase {
    execute(dto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto>;
}
