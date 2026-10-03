import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IUpdateProfileUseCase } from "../../interfaces/use-case/user/IUpdateProfileUseCase.js";
import type { UpdateProfileDto } from "../../dto/user/UpdateProfileDto.js";
import type { UserEntity } from "../../../domain/entities/UserEntity.js";
import type { CloudinaryService } from "../../../infrastructure/services/CloudinaryService.js";

export class UpdateProfileUseCase implements IUpdateProfileUseCase {
    constructor(
        private userRepository: IUserRepository,
        private cloudinaryService?: CloudinaryService
    ) {}

    async execute(dto: UpdateProfileDto): Promise<UserEntity> {
        const existingUser = await this.userRepository.findById(dto.userId);
        if (!existingUser) {
            throw new Error("User not found");
        }

        const profileUpdates: Partial<UserEntity> = {};
        if (dto.firstName !== undefined) profileUpdates.firstName = dto.firstName;
        if (dto.lastName !== undefined) profileUpdates.lastName = dto.lastName;
        if (dto.dob !== undefined) profileUpdates.dob = dto.dob;
        if (dto.gender !== undefined) profileUpdates.gender = dto.gender;
        if (dto.occupation !== undefined) profileUpdates.occupation = dto.occupation;
        if (dto.bio !== undefined) profileUpdates.bio = dto.bio;

        if (dto.selfieBase64) {
            if (!this.cloudinaryService) {
                throw new Error("Cloudinary service is not configured for image uploads");
            }
            const selfieUrl = await this.cloudinaryService.uploadImage(dto.selfieBase64, "kuday_selfies");
            profileUpdates.selfieUrl = selfieUrl;
        } else if (dto.selfieUrl !== undefined) {
            profileUpdates.selfieUrl = dto.selfieUrl;
        }

        const updatedUser = await this.userRepository.updateProfile(dto.userId, profileUpdates);

        if (!updatedUser) {
            throw new Error("Failed to update profile");
        }

        return updatedUser;
    }
}