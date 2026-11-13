export interface ConversationParticipant {
    id: string;
    firstName: string;
    lastName?: string | undefined;
    email: string;
    selfieUrl?: string | undefined;
    role?: string | undefined;
    occupation?: string | undefined;
    identityVerified?: boolean | undefined;
    isPremium?: boolean | undefined;
}

export interface ConversationEntity {
    id: string;
    participants: string[];
    participantDetails?: ConversationParticipant[] | undefined;
    lastMessage?: {
        content: string;
        senderId: string;
        createdAt: string;
    } | undefined;
    unreadCount?: number | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
