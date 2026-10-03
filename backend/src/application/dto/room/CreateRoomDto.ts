export interface CreateRoomDto {
    hostId: string;
    title?: string;
    roomType: string;
    monthlyRent: number;
    location: string;
    capacity: number;
    availabilityNotes: string;
    amenities: string[];
    imagesBase64?: string[]; // Raw base64 images to be uploaded to Cloudinary
    images?: string[]; // Already uploaded image URLs
    description?: string;
}
