import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";

export interface IGetSentInterestsUseCase {
    execute(userId: string): Promise<InterestDetailDto[]>;
}
