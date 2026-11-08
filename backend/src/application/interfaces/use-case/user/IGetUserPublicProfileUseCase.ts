export interface UserPublicProfileDto {
    user: {
        id: string;
        firstName: string;
        lastName?: string;
        email: string;
        dob?: string;
        gender?: string;
        occupation?: string;
        bio?: string;
        role?: 'host' | 'seeker' | 'admin' | 'none';
        selfieUrl?: string;
        idCardUrl?: string;
        identityVerified?: boolean;
        identityStatus?: string;
    };
    lifestyle: {
        smoking?: string;
        drinking?: string;
        sleepSchedule?: string;
        diet?: string;
        cleanliness?: string;
        visitorPolicy?: string;
        roommateGenderPref?: string;
    } | null;
    room?: {
        id: string;
        title?: string;
        description?: string;
        roomType: string;
        monthlyRent: number;
        location: string;
        capacity: number;
        availabilityNotes?: string;
        amenities: string[];
        images: string[];
    } | null;
    seekerPreference?: {
        id: string;
        preferredLocation: string;
        maxBudget: number;
        roomTypePreference: string;
        requiredAmenities: string[];
    } | null;
    matchPercentage: number;
}

export interface IGetUserPublicProfileUseCase {
    execute(userId: string, viewerId?: string): Promise<UserPublicProfileDto | null>;
}
