import type { CallSession, ICallSessionStore } from "@application/interfaces/services/ICallSessionStore";

export class InMemoryCallSessionStore implements ICallSessionStore {
    private sessions = new Map<string, CallSession>();
    private userCallMap = new Map<string, string>(); // userId -> callId

    createSession(session: CallSession): void {
        this.sessions.set(session.callId, session);
        this.userCallMap.set(session.callerId, session.callId);
        this.userCallMap.set(session.receiverId, session.callId);
    }

    getSession(callId: string): CallSession | undefined {
        return this.sessions.get(callId);
    }

    getSessionByUser(userId: string): CallSession | undefined {
        const callId = this.userCallMap.get(userId);
        if (!callId) return undefined;
        return this.sessions.get(callId);
    }

    updateSession(callId: string, updates: Partial<CallSession>): CallSession | undefined {
        const existing = this.sessions.get(callId);
        if (!existing) return undefined;

        const updated: CallSession = {
            ...existing,
            ...updates,
        };
        this.sessions.set(callId, updated);
        return updated;
    }

    removeSession(callId: string): void {
        const session = this.sessions.get(callId);
        if (session) {
            if (session.ringTimeoutTimer) {
                clearTimeout(session.ringTimeoutTimer);
            }
            this.userCallMap.delete(session.callerId);
            this.userCallMap.delete(session.receiverId);
            this.sessions.delete(callId);
        }
    }

    isUserInCall(userId: string): boolean {
        const callId = this.userCallMap.get(userId);
        if (!callId) return false;
        const session = this.sessions.get(callId);
        return Boolean(session && session.status !== "ended");
    }

    get(callId: string): CallSession | undefined {
        return this.getSession(callId);
    }

    getByUserId(userId: string): CallSession | undefined {
        return this.getSessionByUser(userId);
    }

    update(callId: string, updates: Partial<CallSession>): CallSession | undefined {
        return this.updateSession(callId, updates);
    }

    remove(callId: string): void {
        this.removeSession(callId);
    }
}
