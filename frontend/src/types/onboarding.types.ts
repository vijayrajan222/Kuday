export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  occupation?: string;
  bio?: string;
  selfieUrl?: string;
  selfieBase64?: string;
}

export interface LifestylePayload {
  userId: string;
  smoking: string;
  drinking: string;
  sleepSchedule: string;
  diet?: string;
  cleanliness: string;
  visitorPolicy: string;
  roommateGenderPref: string;
}

export interface RoomPayload {
  hostId: string;
  title?: string;
  roomType: string;
  monthlyRent: number;
  location: string;
  capacity: number;
  availabilityNotes: string;
  amenities: string[];
  images?: string[];
  imagesBase64?: string[];
  description?: string;
}

export interface HostProfile {
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
  lifestyle?: LifestylePayload | null;
}

export interface RoomEntity {
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
  createdAt?: string;
  updatedAt?: string;

  // Enriched Fields from Backend
  host?: HostProfile;
  matchPercentage?: number;
}

export interface SeekerPreferencePayload {
  userId: string;
  preferredLocation: string;
  maxBudget: number;
  roomTypePreference: string;
  requiredAmenities: string[];
}

export interface SeekerProfile {
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
  lifestyle?: LifestylePayload | null;
}

export interface SeekerPreferenceEntity {
  id: string;
  userId: string;
  preferredLocation: string;
  maxBudget: number;
  roomTypePreference: string;
  requiredAmenities: string[];
  createdAt?: string;
  updatedAt?: string;

  // Enriched Fields from Backend
  seeker?: SeekerProfile;
  matchPercentage?: number;
}
