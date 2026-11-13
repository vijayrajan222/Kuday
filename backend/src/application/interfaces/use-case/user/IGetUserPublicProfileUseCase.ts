export interface UserPublicProfileDto {
    user: {
        id: string;
        firstName: string;
        lastName?: string | undefined;
        email: string;
        dob?: string | undefined;
        gender?: string | undefined;
        occupation?: string | undefined;
        bio?: string | undefined;
        role?: 'host' | 'seeker' | 'admin' | 'none' | undefined;
        selfieUrl?: string | undefined;
        idCardUrl?: string | undefined;
        identityVerified?: boolean | undefined;
        identityStatus?: string | undefined;
    };
    lifestyle: {
        smoking?: string | undefined;
        drinking?: string | undefined;
        sleepSchedule?: string | undefined;
        diet?: string | undefined;
        cleanliness?: string | undefined;
        visitorPolicy?: string | undefined;
        roommateGenderPref?: string | undefined;
    } | null;
    room?: {
        id: string;
        title?: string | undefined;
        description?: string | undefined;
        roomType: string;
        monthlyRent: number;
        location: string;
        capacity: number;
        availabilityNotes?: string | undefined;
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
