import type { CallType, CallOutcome } from "@domain/entities/MessageEntity";

export interface StartCallDto {
    callerId: string;
    receiverId: string;
    callType: "audio" | "video";
}

export interface LogCallDto {
    callerId: string;
    receiverId: string;
    callType: CallType;
    outcome: CallOutcome;
    startedAt: Date;
    answeredAt?: Date | undefined;
    endedAt: Date;
    conversationId?: string | undefined;
}

// Aliases for backwards compatibility
export type StartCallInput = StartCallDto;
export type LogCallInput = LogCallDto;
