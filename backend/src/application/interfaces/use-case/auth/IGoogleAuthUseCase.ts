import type { GoogleAuthRequestDto, GoogleAuthResponseDto } from "../../../dto/auth/GoogleAuthDto.js";

export interface IGoogleAuthUseCase {
  execute(dto: GoogleAuthRequestDto): Promise<GoogleAuthResponseDto>;
}