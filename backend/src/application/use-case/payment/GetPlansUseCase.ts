import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { PlanEntity } from "@domain/entities/PlanEntity";

export class GetPlansUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(audience?: string): Promise<PlanEntity[]> {
        return this.planRepo.findAllActive(audience);
    }
}
