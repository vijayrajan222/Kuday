import type { CreateLifestyleDto } from "@application/dto/lifestyle/CreateLifestyleDto";
import type { LifestyleEntity } from "@domain/entities/LifestyleEntity";

export interface ICreateLifestyleUseCase {
    execute(dto: CreateLifestyleDto): Promise<LifestyleEntity>;
}
