import type { RefreshTokenRequestDto, RefreshTokenResultDto } from "@application/dto/auth/RefreshTokenDto";

export interface IRefreshTokenUseCase {
    execute(dto: RefreshTokenRequestDto): Promise<RefreshTokenResultDto>;
}
