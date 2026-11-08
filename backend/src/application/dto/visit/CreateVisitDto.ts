import type { TimeSlot } from "@domain/entities/VisitEntity";

export interface CreateVisitDto {
    connectionId: string;
    seekerId: string;
    hostId: string;
    roomId?: string | undefined;
    date: string;
    timeSlot: TimeSlot;
    slotTime: string;
    message?: string | undefined;
}
