import type { loginRequestDto, loginResponseDto } from "../../../dto/auth/LoginDto.js";

export interface ILoginUserUseCase {
    exicute(dto: loginRequestDto): Promise<loginResponseDto>;
}