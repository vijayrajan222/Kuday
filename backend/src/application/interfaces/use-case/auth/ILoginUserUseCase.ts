import type { loginRequestDto, loginResponseDto } from "@application/dto/auth/LoginDto";

export interface ILoginUserUseCase {
    execute(dto: loginRequestDto): Promise<loginResponseDto>;
}