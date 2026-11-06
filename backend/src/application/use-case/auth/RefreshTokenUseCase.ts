import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import type { IJwtService } from "@application/interfaces/services/IJwtServices.js";
import type { IRefreshTokenUseCase } from "@application/interfaces/use-case/auth/IRefreshTokenUseCase.js";
import type { RefreshTokenRequestDto, RefreshTokenResultDto } from "@application/dto/auth/RefreshTokenDto.js";

export class RefreshTokenUseCase implements IRefreshTokenUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly jwtService: IJwtService
    ) {}

    async execute(dto: RefreshTokenRequestDto): Promise<RefreshTokenResultDto> {
        const decoded = this.jwtService.verifyToken(dto.refreshToken, true);
        if (!decoded) {
            throw new Error("Invalid or expired refresh token.");
        }

        const user = await this.userRepository.findById(decoded.userId);
        if (!user) {
            throw new Error("User no longer exists.");
        }

        if (user.isBlocked) {
            throw new Error("Your account has been blocked. Please contact support.");
        }

        const accessToken = this.jwtService.generateToken({
            userId: decoded.userId,
            email: decoded.email,
        });

        return {
            accessToken,
            userId: decoded.userId,
            email: decoded.email,
        };
    }
}
