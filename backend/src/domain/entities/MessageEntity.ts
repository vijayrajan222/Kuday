export type MessageType = "text" | "call";
export type CallType = "audio" | "video";
export type CallOutcome = "completed" | "missed" | "declined";

export interface MessageEntity {
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
    createdAt?: string;
    updatedAt?: string;
}
