import type { LifestyleEntity } from "@domain/entities/LifestyleEntity";

export interface CreateLifestyleDto {
    userId: string;
    smoking: string;
    drinking: string;
    sleepSchedule: string;
    diet: string;
    cleanliness: string;
    visitorPolicy: string;
    roommateGenderPref: string;
}

export interface GetLifestyleDto {
    userId: string;
}

export type GetLifestyleOutputDto = LifestyleEntity | null;
