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

export interface ConversationEntity {
    id: string;
    participants: string[];
    participantDetails?: ConversationParticipant[];
    lastMessage?: {
        content: string;
        senderId: string;
        createdAt: string;
    };
    unreadCount?: number;
    createdAt?: string;
    updatedAt?: string;
}
