import type { RefreshTokenRequestDto, RefreshTokenResultDto } from "../../../dto/auth/RefreshTokenDto.js";

export interface IRefreshTokenUseCase {
    execute(dto: RefreshTokenRequestDto): Promise<RefreshTokenResultDto>;
}
