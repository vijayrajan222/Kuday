import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IUpdateProfileUseCase } from "../../interfaces/use-case/user/IUpdateProfileUseCase.js";
import type { UpdateProfileDto } from "../../dto/user/UpdateProfileDto.js";
import type { UserEntity } from "../../../domain/entities/UserEntity.js";
import type { ICloudinaryService } from "../../interfaces/services/ICloudinaryService.js";

export class UpdateProfileUseCase implements IUpdateProfileUseCase {
    constructor(
        private userRepository: IUserRepository,
        private cloudinaryService?: ICloudinaryService
    ) {}

    async execute(dto: UpdateProfileDto): Promise<UserEntity> {
        const existingUser = await this.userRepository.findById(dto.userId);
        if (!existingUser) {
            throw new Error("User not found");
        }

        const profileUpdates: Partial<UserEntity> = {};
        if (dto.firstName !== undefined) profileUpdates.firstName = dto.firstName;
        if (dto.lastName !== undefined) profileUpdates.lastName = dto.lastName;
        if (dto.dob !== undefined) {
            if (dto.dob) {
                const dobDate = new Date(dto.dob);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                if (isNaN(dobDate.getTime())) {
                    throw new Error("Invalid date of birth format");
                }
                if (dobDate > today) {
                    throw new Error("Date of birth cannot be in the future");
                }
                const eighteenYearsAgo = new Date();
                eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
                eighteenYearsAgo.setHours(23, 59, 59, 999);
                if (dobDate > eighteenYearsAgo) {
                    throw new Error("You must be at least 18 years old to use this platform");
                }
                const hundredYearsAgo = new Date();
                hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
                if (dobDate < hundredYearsAgo) {
                    throw new Error("Please enter a valid date of birth within the last 100 years");
                }
            }
            profileUpdates.dob = dto.dob;
        }
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
