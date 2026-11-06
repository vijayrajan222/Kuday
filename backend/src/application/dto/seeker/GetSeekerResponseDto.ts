import type { LifestyleEntity } from "@domain/entities/LifestyleEntity.js";

export interface SeekerProfileDto {
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    gender?: string;
    occupation?: string;
    bio?: string;
    selfieUrl?: string;
    idCardUrl?: string;
    identityVerified: boolean;
    identityStatus?: string;
    lifestyle?: LifestyleEntity | null;
}

export interface SeekerPreferenceWithUserDto {
    id: string;
    userId: string;
    preferredLocation: string;
    maxBudget: number;
    roomTypePreference: string;
    requiredAmenities: string[];
    createdAt?: string;
    updatedAt?: string;

    // Enriched Seeker Profile Details & Calculated Compatibility Score
    seeker: SeekerProfileDto;
    matchPercentage: number;
}
