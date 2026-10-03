export interface RoomEntity {
    id: string;
    hostId: string;
    title?: string | undefined;
    roomType: string;
    monthlyRent: number;
    location: string;
    capacity: number;
    availabilityNotes: string;
    amenities: string[];
    images: string[];
    description?: string | undefined;
    isActive?: boolean | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
