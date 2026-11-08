import type { TimeSlot } from "@domain/entities/VisitEntity";

export interface SuggestVisitDto {
    visitId: string;
    userId: string;
    suggestedDate: string;
    suggestedTimeSlot: TimeSlot;
    suggestedSlotTime: string;
    suggestedMessage?: string | undefined;
}
