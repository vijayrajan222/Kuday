
import type { LifestyleEntity } from "@domain/entities/LifestyleEntity";

export interface ILifestyleRepository {
    upsert(lifestyle: Omit<LifestyleEntity, "id">): Promise<LifestyleEntity>;
    findByUserId(userId: string): Promise<LifestyleEntity | null>;
}