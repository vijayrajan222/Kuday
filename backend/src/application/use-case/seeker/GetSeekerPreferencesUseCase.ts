import type { IGetSeekerPreferencesUseCase } from "../../interfaces/use-case/seeker/IGetSeekerPreferencesUseCase.js";
import type { ISeekerPreferenceRepository } from "../../interfaces/repository/ISeekerPreferenceRepository.js";
import type { SeekerPreferenceEntity } from "../../../domain/entities/SeekerPreferenceEntity.js";

export class GetSeekerPreferencesUseCase implements IGetSeekerPreferencesUseCase {
    constructor(private seekerRepository: ISeekerPreferenceRepository) {}

    async execute(): Promise<SeekerPreferenceEntity[]> {
        return this.seekerRepository.findAll();
    }

    async getByUserId(userId: string): Promise<SeekerPreferenceEntity | null> {
        return this.seekerRepository.findByUserId(userId);
    }
}
