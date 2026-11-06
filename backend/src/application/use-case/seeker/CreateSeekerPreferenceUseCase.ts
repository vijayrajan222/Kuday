import type { ICreateSeekerPreferenceUseCase } from "@application/interfaces/use-case/seeker/ICreateSeekerPreferenceUseCase";
import type { ISeekerPreferenceRepository } from "@application/interfaces/repository/ISeekerPreferenceRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { CreateSeekerPreferenceDto } from "@application/dto/seeker/CreateSeekerPreferenceDto";
import type { SeekerPreferenceEntity } from "@domain/entities/SeekerPreferenceEntity";

export class CreateSeekerPreferenceUseCase implements ICreateSeekerPreferenceUseCase {
    constructor(
        private seekerRepository: ISeekerPreferenceRepository,
        private userRepository: IUserRepository
    ) {}

    async execute(dto: CreateSeekerPreferenceDto): Promise<SeekerPreferenceEntity> {
        if (!dto.preferredLocation || dto.preferredLocation.trim().length < 2) {
            throw new Error("Preferred location must be at least 2 characters");
        }
        if (!dto.maxBudget || Number(dto.maxBudget) <= 0) {
            throw new Error("Maximum budget must be a positive number greater than 0");
        }

        const preference = await this.seekerRepository.save(dto);

        // Mark user as onboarded with seeker role
        await this.userRepository.updateProfile(dto.userId, {
            isOnboarded: true,
            role: "seeker",
        });

        return preference;
    }
}
