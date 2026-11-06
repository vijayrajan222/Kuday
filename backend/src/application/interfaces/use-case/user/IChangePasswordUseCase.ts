import type { ChangePasswordRequestDto, ChangePasswordResponseDto } from "../../../dto/user/ChangePasswordDto.js";

export interface IChangePasswordUseCase {
    execute(dto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto>;
}
