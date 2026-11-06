import type { ChangePasswordRequestDto, ChangePasswordResponseDto } from "@application/dto/user/ChangePasswordDto";

export interface IChangePasswordUseCase {
    execute(dto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto>;
}
