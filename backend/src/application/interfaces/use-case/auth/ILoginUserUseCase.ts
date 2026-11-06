import type { loginRequestDto, loginResponseDto } from "@application/dto/auth/LoginDto.js";

export interface ILoginUserUseCase {
    execute(dto: loginRequestDto): Promise<loginResponseDto>;
}