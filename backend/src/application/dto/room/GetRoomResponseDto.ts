import type { LifestyleEntity } from "@domain/entities/LifestyleEntity.js";

export interface HostProfileDto {
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

export interface RoomWithHostDto {
    id: string;
    hostId: string;
    title?: string;
    roomType: string;
    monthlyRent: number;
    location: string;
    capacity: number;
    availabilityNotes: string;
    amenities: string[];
    images: string[];
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;

    // Enriched Host Details & Calculated Compatibility Score
    host: HostProfileDto;
    matchPercentage: number;
}
