import type { LifestyleEntity } from "@domain/entities/LifestyleEntity";

export interface IGetLifestyleUseCase {
    execute(userId: string): Promise<LifestyleEntity | null>;
}
