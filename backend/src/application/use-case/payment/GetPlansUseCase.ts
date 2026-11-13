import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { IGetPlansUseCase } from "@application/interfaces/use-case/payment/IGetPlansUseCase";
import type { PlanEntity } from "@domain/entities/PlanEntity";

export class GetPlansUseCase implements IGetPlansUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(audience?: string): Promise<PlanEntity[]> {
        return this.planRepo.findAllActive(audience);
    }
}
