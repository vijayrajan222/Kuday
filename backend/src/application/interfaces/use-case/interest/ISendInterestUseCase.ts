import type { SendInterestDto } from "@application/dto/interest/SendInterestDto";
import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";

export interface ISendInterestUseCase {
    execute(dto: SendInterestDto): Promise<InterestDetailDto>;
}
