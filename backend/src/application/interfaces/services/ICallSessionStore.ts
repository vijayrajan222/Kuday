export interface CallSession {
    callId: string;
    id?: string;
    callerId: string;
    callerName?: string;
    receiverId: string;
    hostId?: string;
    callType: "audio" | "video";
    status: "ringing" | "connected" | "ongoing" | "ended";
    startedAt: Date;
    answeredAt?: Date;
    endedAt?: Date;
    ringTimeoutTimer?: NodeJS.Timeout;
    isLogged?: boolean;
}

export interface ICallSessionStore {
    createSession(session: CallSession): void;
    getSession(callId: string): CallSession | undefined;
    getSessionByUser(userId: string): CallSession | undefined;
    updateSession(callId: string, updates: Partial<CallSession>): CallSession | undefined;
    removeSession(callId: string): void;
    isUserInCall(userId: string): boolean;

    // Aliases
    get(callId: string): CallSession | undefined;
    getByUserId(userId: string): CallSession | undefined;
    update(callId: string, updates: Partial<CallSession>): CallSession | undefined;
    remove(callId: string): void;
}
