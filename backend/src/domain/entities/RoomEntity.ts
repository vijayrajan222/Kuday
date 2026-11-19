export interface RoomEntity {
    id: string;
    hostId: string;
    title?: string | undefined;
    roomType: string;
    monthlyRent: number;
    location: string;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    capacity: number;
    availableSlots: number;
    availabilityNotes: string;
    amenities: string[];
    images: string[];
    description?: string | undefined;
    isActive?: boolean | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
