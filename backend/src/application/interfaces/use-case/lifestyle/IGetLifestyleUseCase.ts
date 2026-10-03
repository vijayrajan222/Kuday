import type { LifestyleEntity } from "../../../../domain/entities/LifestyleEntity.js";

export interface IGetLifestyleUseCase {
    execute(userId: string): Promise<LifestyleEntity | null>;
}
