import type { InterestStatus } from "@domain/entities/InterestEntity";

export interface UpdateInterestStatusDto {
    interestId: string;
    userId: string;
    status: InterestStatus;
}
