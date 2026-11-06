import type { GoogleAuthRequestDto, GoogleAuthResponseDto } from "@application/dto/auth/GoogleAuthDto.js";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import type { IJwtService } from "@application/interfaces/services/IJwtServices.js";
import type { IGoogleAuthUseCase } from "@application/interfaces/use-case/auth/IGoogleAuthUseCase.js";

export class GoogleAuthUseCase implements IGoogleAuthUseCase {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _jwtService: IJwtService
  ) {}

  async execute(dto: GoogleAuthRequestDto): Promise<GoogleAuthResponseDto> {
    const cleanedEmail = dto.email.trim().toLowerCase();

    let user = await this._userRepo.findByEmail(cleanedEmail);

    if (user) {
      if (user.isBlocked) {
        throw new Error("Your account has been blocked. Please contact support.");
      }

      // Automatically verify email since Google email is pre-verified
      if (!user.isVerified) {
        await this._userRepo.updateVerificationStatus(cleanedEmail, true);
        user.isVerified = true;
      }
    } else {
      // Create new Google user marked as verified
      user = await this._userRepo.save({
        email: cleanedEmail,
        firstName: dto.firstName || "Google User",
        lastName: dto.lastName || "",
        hashedPassword: "GOOGLE_OAUTH_ACCOUNT",
        isVerified: true,
        isBlocked: false,
      });
    }

    const token = this._jwtService.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
      message: "Google authentication successful.",
      isOnboarded: user.isOnboarded,
      role: user.role,
      identityVerified: user.identityVerified,
    };
  }
}