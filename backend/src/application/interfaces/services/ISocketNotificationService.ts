export interface ISocketNotificationService {
    notifyUser(userId: string, event: string, payload: unknown): void;
}
