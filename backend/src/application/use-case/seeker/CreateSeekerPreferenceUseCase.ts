import type { ICreateSeekerPreferenceUseCase } from "../../interfaces/use-case/seeker/ICreateSeekerPreferenceUseCase.js";
import type { ISeekerPreferenceRepository } from "../../interfaces/repository/ISeekerPreferenceRepository.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { CreateSeekerPreferenceDto } from "../../dto/seeker/CreateSeekerPreferenceDto.js";
import type { SeekerPreferenceEntity } from "../../../domain/entities/SeekerPreferenceEntity.js";

export class CreateSeekerPreferenceUseCase implements ICreateSeekerPreferenceUseCase {
    constructor(
        private seekerRepository: ISeekerPreferenceRepository,
        private userRepository: IUserRepository
    ) {}

    async execute(dto: CreateSeekerPreferenceDto): Promise<SeekerPreferenceEntity> {
        const preference = await this.seekerRepository.save(dto);

        // Mark user as onboarded with seeker role
        await this.userRepository.updateProfile(dto.userId, {
            isOnboarded: true,
            role: "seeker",
        });

        return preference;
    }
}
