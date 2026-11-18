export interface ISocketNotificationService {
    notifyUser(userId: string, event: string, payload: unknown): void;
    emitToUser?(userId: string, event: string, payload: unknown): void;
    emitToAgreement?(agreementId: string, event: string, payload: unknown): void;
}
