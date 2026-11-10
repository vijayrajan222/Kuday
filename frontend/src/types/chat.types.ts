export type MessageType = "text" | "call";
export type CallType = "audio" | "video";
export type CallOutcome = "completed" | "missed" | "declined";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type?: MessageType;
  callType?: CallType;
  outcome?: CallOutcome;
  startedAt?: string | Date;
  endedAt?: string | Date;
  durationSec?: number;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationParticipant {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  selfieUrl?: string;
  role?: string;
  occupation?: string;
  identityVerified?: boolean;
  isPremium?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails?: ConversationParticipant[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount?: number;
  isOnline?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  senderId: string;
  receiverId: string;
  content: string;
  conversationId?: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
