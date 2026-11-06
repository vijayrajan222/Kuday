import type { GoogleAuthRequestDto, GoogleAuthResponseDto } from "@application/dto/auth/GoogleAuthDto.js";

export interface IGoogleAuthUseCase {
  execute(dto: GoogleAuthRequestDto): Promise<GoogleAuthResponseDto>;
}