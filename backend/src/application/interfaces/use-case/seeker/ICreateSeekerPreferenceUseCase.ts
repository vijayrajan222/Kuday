import type { SeekerPreferenceEntity } from "../../../../domain/entities/SeekerPreferenceEntity.js";
import type { CreateSeekerPreferenceDto } from "../../../dto/seeker/CreateSeekerPreferenceDto.js";

export interface ICreateSeekerPreferenceUseCase {
    execute(dto: CreateSeekerPreferenceDto): Promise<SeekerPreferenceEntity>;
}
