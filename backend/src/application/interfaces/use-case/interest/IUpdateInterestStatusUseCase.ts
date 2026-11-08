import type { UpdateInterestStatusDto } from "@application/dto/interest/UpdateInterestStatusDto";
import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";

export interface IUpdateInterestStatusUseCase {
    execute(dto: UpdateInterestStatusDto): Promise<InterestDetailDto>;
}
