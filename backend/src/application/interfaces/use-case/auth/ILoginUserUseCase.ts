import type { loginRequestDto, loginResponseDto } from "../../../dto/auth/LoginDto.js";

export interface ILoginUserUseCase {
    execute(dto: loginRequestDto): Promise<loginResponseDto>;
}