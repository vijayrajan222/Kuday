export type InterestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'unmatched';
export type InterestTargetType = 'room' | 'seeker';

export interface InterestUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  selfieUrl?: string;
  role?: string;
  occupation?: string;
  identityVerified?: boolean;
}

export interface InterestDetail {
  id: string;
  senderId: string;
  receiverId: string;
  targetType: InterestTargetType;
  targetId: string;
  status: InterestStatus;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
  sender?: InterestUser;
  receiver?: InterestUser;
  targetTitle?: string;
}

export interface SendInterestPayload {
  senderId: string;
  receiverId: string;
  targetType: InterestTargetType;
  targetId: string;
  message?: string;
}
