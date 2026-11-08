import type { VisitEntity } from "@domain/entities/VisitEntity";

export interface VisitParticipantDto {
    id: string;
    firstName: string;
    lastName?: string | undefined;
    email: string;
    selfieUrl?: string | undefined;
    identityVerified?: boolean | undefined;
    occupation?: string | undefined;
    role?: string | undefined;
}

export interface VisitRoomSummaryDto {
    id: string;
    title?: string | undefined;
    location: string;
    monthlyRent: number;
    roomType: string;
    images?: string[] | undefined;
}

export interface VisitDetailDto extends VisitEntity {
    seeker?: VisitParticipantDto | undefined;
    host?: VisitParticipantDto | undefined;
    room?: VisitRoomSummaryDto | undefined;
}
