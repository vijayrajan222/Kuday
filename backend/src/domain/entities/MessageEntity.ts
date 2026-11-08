export interface MessageEntity {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt?: string;
    updatedAt?: string;
}
