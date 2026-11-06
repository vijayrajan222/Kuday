import type { RefreshTokenRequestDto, RefreshTokenResultDto } from "@application/dto/auth/RefreshTokenDto.js";

export interface IRefreshTokenUseCase {
    execute(dto: RefreshTokenRequestDto): Promise<RefreshTokenResultDto>;
}
