import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";

export interface IGetReceivedInterestsUseCase {
    execute(userId: string): Promise<InterestDetailDto[]>;
}
