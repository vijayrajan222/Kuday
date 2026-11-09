import type { PlanEntity } from "@domain/entities/PlanEntity";

export interface IPlanRepository {
    create(data: Omit<PlanEntity, "id" | "createdAt" | "updatedAt">): Promise<PlanEntity>;
    findById(id: string): Promise<PlanEntity | null>;
    findByName(name: string): Promise<PlanEntity | null>;
    findAllActive(audience?: string): Promise<PlanEntity[]>;
    count(): Promise<number>;
}
