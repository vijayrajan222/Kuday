import type { GetPlansInputDto, GetPlansOutputDto } from "@application/dto/payment/PaymentDto";
import type { PlanEntity } from "@domain/entities/PlanEntity";

export interface IGetPlansUseCase {
    execute(input?: GetPlansInputDto | string): Promise<GetPlansOutputDto>;
}

export type { GetPlansInputDto, GetPlansOutputDto, PlanEntity };
