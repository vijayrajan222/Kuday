export interface CreateSeekerPreferenceDto {
    userId: string;
    preferredLocation: string;
    maxBudget: number;
    roomTypePreference: string;
    requiredAmenities: string[];
}
