import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { IGetPlansUseCase } from "@application/interfaces/use-case/payment/IGetPlansUseCase";
import type { GetPlansInputDto, GetPlansOutputDto } from "@application/dto/payment/PaymentDto";

export class GetPlansUseCase implements IGetPlansUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(input?: GetPlansInputDto | string): Promise<GetPlansOutputDto> {
        const audience = typeof input === "object" && input !== null ? input.audience : input;
        return this.planRepo.findAllActive(audience);
    }
}
