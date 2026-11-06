import type { CreateLifestyleDto } from "@application/dto/lifestyle/CreateLifestyleDto.js";
import type { LifestyleEntity } from "@domain/entities/LifestyleEntity.js";

export interface ICreateLifestyleUseCase {
    execute(dto: CreateLifestyleDto): Promise<LifestyleEntity>;
}
