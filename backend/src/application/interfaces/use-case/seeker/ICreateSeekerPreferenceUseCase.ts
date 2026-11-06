import type { SeekerPreferenceEntity } from "@domain/entities/SeekerPreferenceEntity";
import type { CreateSeekerPreferenceDto } from "@application/dto/seeker/CreateSeekerPreferenceDto";

export interface ICreateSeekerPreferenceUseCase {
    execute(dto: CreateSeekerPreferenceDto): Promise<SeekerPreferenceEntity>;
}
