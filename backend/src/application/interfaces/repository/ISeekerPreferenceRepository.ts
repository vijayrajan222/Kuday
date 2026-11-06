import type { SeekerPreferenceEntity } from "@domain/entities/SeekerPreferenceEntity";

export interface ISeekerPreferenceRepository {
    save(preferenceData: Omit<SeekerPreferenceEntity, "id">): Promise<SeekerPreferenceEntity>;
    updateStatusByUserId(userId: string, isActive: boolean): Promise<void>;
    findByUserId(userId: string): Promise<SeekerPreferenceEntity | null>;
    findAll(): Promise<SeekerPreferenceEntity[]>;
}
