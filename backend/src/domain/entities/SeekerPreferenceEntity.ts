export interface SeekerPreferenceEntity {
    id: string;
    userId: string;
    preferredLocation: string;
    maxBudget: number;
    roomTypePreference: string;
    requiredAmenities: string[];
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
