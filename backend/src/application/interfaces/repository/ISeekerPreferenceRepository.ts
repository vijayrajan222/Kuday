import type { SeekerPreferenceEntity } from "../../../domain/entities/SeekerPreferenceEntity.js";

export interface ISeekerPreferenceRepository {
    save(preferenceData: Omit<SeekerPreferenceEntity, "id">): Promise<SeekerPreferenceEntity>;
    findByUserId(userId: string): Promise<SeekerPreferenceEntity | null>;
    findAll(): Promise<SeekerPreferenceEntity[]>;
}
