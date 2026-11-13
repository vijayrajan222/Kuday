export interface ISocketEmitter {
    to(room: string): { emit(event: string, payload: unknown): void };
}

export interface ISocketChatService {
    isUserOnline(userId: string): boolean;
    getIo(): ISocketEmitter | null;
    notifyUser(userId: string, event: string, payload: unknown): void;
}
