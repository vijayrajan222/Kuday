export type VisitStatus = 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'rejected' | 'completed';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface VisitEntity {
    id: string;
    connectionId: string;
    seekerId: string;
    hostId: string;
    createdBy?: string | undefined;
    suggestedById?: string | undefined;
    roomId?: string | undefined;
    date: string; // YYYY-MM-DD
    timeSlot: TimeSlot;
    slotTime: string; // e.g. "10:00 AM", "02:00 PM", "06:00 PM"
    message?: string | undefined;
    status: VisitStatus;
    suggestedBy?: 'seeker' | 'host' | undefined;
    suggestedDate?: string | undefined;
    suggestedTimeSlot?: TimeSlot | undefined;
    suggestedSlotTime?: string | undefined;
    suggestedMessage?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
