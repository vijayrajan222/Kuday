import type { PlanEntity } from "@domain/entities/PlanEntity";

export interface IGetPlansUseCase {
    execute(audience?: string): Promise<PlanEntity[]>;
}
