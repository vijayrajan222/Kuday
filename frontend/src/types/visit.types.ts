export type VisitStatus = 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'rejected' | 'completed';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface VisitParticipant {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  selfieUrl?: string;
  identityVerified?: boolean;
  occupation?: string;
  role?: string;
}

export interface VisitRoomSummary {
  id: string;
  title?: string;
  location: string;
  monthlyRent: number;
  roomType: string;
  images?: string[];
}

export interface Visit {
  id: string;
  connectionId: string;
  seekerId: string;
  hostId: string;
  createdBy?: string;
  suggestedById?: string;
  roomId?: string;
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  slotTime: string;
  message?: string;
  status: VisitStatus;
  suggestedBy?: 'seeker' | 'host';
  suggestedDate?: string;
  suggestedTimeSlot?: TimeSlot;
  suggestedSlotTime?: string;
  suggestedMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  seeker?: VisitParticipant;
  host?: VisitParticipant;
  room?: VisitRoomSummary;
}

export interface CreateVisitRequest {
  connectionId: string;
  seekerId: string;
  hostId: string;
  createdBy?: string;
  suggestedById?: string;
  roomId?: string;
  date: string;
  timeSlot: TimeSlot;
  slotTime: string;
  message?: string;
}

export interface SuggestVisitRequest {
  suggestedDate: string;
  suggestedTimeSlot: TimeSlot;
  suggestedSlotTime: string;
  suggestedMessage?: string;
}
