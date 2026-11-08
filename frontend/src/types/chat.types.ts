export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
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
