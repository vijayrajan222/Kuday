import type { loginRequestDto, loginResponseDto } from "../../dto/auth/LoginDto.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IHashingService } from "../../interfaces/services/IhashingService.js";
import type { IJwtService } from "../../interfaces/services/IJwtServices.js";
import type { ILoginUserUseCase } from "../../interfaces/use-case/auth/ILoginUserUseCase.js";

export class LoginUserUseCase implements ILoginUserUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _hashService: IHashingService,
        private readonly _jwtService: IJwtService
    ) {}

    async execute(dto: loginRequestDto): Promise<loginResponseDto> {
        const cleanedEmail = dto.email.trim().toLowerCase();

        const existingUser = await this._userRepo.findByEmail(cleanedEmail);

        if (!existingUser) {
            throw new Error("Invalid email or password.");
        }

        if (existingUser.isBlocked) {
            throw new Error("Your account has been blocked. Please contact support.");
        }

        if (!existingUser.isVerified) {
            throw new Error("Please verify your email address before logging in.");
        }

        const isPasswordValid = await this._hashService.compareHashes(
            dto.password,
            existingUser.hashedPassword || ""
        );

        if (!isPasswordValid) {
            throw new Error("Invalid email or password.");
        }

        const token = this._jwtService.generateToken({
            userId: existingUser.id,
            email: existingUser.email,
        });

        return {
            id: existingUser.id,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            token: token,
            message: "User logged in successfully.",
            isOnboarded: existingUser.isOnboarded,
            role: existingUser.role,
            identityVerified: existingUser.identityVerified,
        };
    }
}
