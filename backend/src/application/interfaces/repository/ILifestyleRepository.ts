
import type { LifestyleEntity } from "@domain/entities/LifestyleEntity.js";

export interface ILifestyleRepository {
    upsert(lifestyle: Omit<LifestyleEntity, "id">): Promise<LifestyleEntity>;
    findByUserId(userId: string): Promise<LifestyleEntity | null>;
}