import type { NotificationEntity } from "@domain/entities/NotificationEntity";

export interface INotificationRepository {
    create(data: Omit<NotificationEntity, "id">): Promise<NotificationEntity>;
    findByUserId(userId: string): Promise<NotificationEntity[]>;
    markAsRead(id: string): Promise<NotificationEntity | null>;
    markAllAsRead(userId: string): Promise<void>;
}
