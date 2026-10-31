import type { NotificationEntity } from "../../../../domain/entities/NotificationEntity.js";

export interface IMarkNotificationReadUseCase {
    markSingle(id: string): Promise<NotificationEntity | null>;
    markAll(userId: string): Promise<void>;
}
