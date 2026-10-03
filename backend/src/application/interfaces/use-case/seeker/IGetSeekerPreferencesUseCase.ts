import type { SeekerPreferenceEntity } from "../../../../domain/entities/SeekerPreferenceEntity.js";

export interface IGetSeekerPreferencesUseCase {
    execute(): Promise<SeekerPreferenceEntity[]>;
    getByUserId(userId: string): Promise<SeekerPreferenceEntity | null>;
}
