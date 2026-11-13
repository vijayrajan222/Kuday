import type { MessageEntity, CallType, CallOutcome } from "@domain/entities/MessageEntity";

export interface LogCallInput {
    callerId: string;
    receiverId: string;
    callType: CallType;
    outcome: CallOutcome;
    startedAt: Date;
    answeredAt?: Date;
    endedAt: Date;
    conversationId?: string;
}

export interface ILogCallUseCase {
    execute(input: LogCallInput): Promise<MessageEntity>;
}
