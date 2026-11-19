export interface ActiveRoommatePartnerDto {
    id: string;
    firstName: string;
    lastName?: string | undefined;
    email: string;
    role: string;
    occupation?: string | undefined;
    selfieUrl?: string | undefined;
    identityVerified: boolean;
}

export interface ActiveRoommateRoomDto {
    id: string;
    title?: string | undefined;
    roomType: string;
    monthlyRent: number;
    location: string;
    images: string[];
}

export interface ActiveRoommateResponseDto {
    agreementId: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    status: string;
    commonTerms: {
        rent: number;
        deposit: number;
        moveInDate: string;
        durationMonths: number;
        utilities: string;
    };
    partner: ActiveRoommatePartnerDto;
    room: ActiveRoommateRoomDto;
}
