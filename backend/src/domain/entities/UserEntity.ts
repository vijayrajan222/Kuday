export interface UserEntity {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    hashedPassword?: string;
    isVerified: boolean;
    isBlocked: boolean;
    isAdmin?: boolean | undefined;
    isPremium?: boolean | undefined;
    premiumExpiresAt?: Date | undefined;
    otp?: number | null | undefined;

    // Profile Fields
    dob?: string;
    gender?: string;
    occupation?: string;
    bio?: string;
    role?: 'host' | 'seeker' | 'admin' | 'none';
    isOnboarded?: boolean;

    // Identity Verification Fields
    idCardUrl?: string;
    selfieUrl?: string;
    identityVerified?: boolean;
    identityStatus?: 'pending' | 'verified' | 'rejected' | 'none';
    rejectionReason?: string;
}