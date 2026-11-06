import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { NotificationEntity } from "@domain/entities/NotificationEntity";
import type { IMarkNotificationReadUseCase } from "@application/interfaces/use-case/notification/IMarkNotificationReadUseCase";

export class MarkNotificationReadUseCase implements IMarkNotificationReadUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async markSingle(id: string): Promise<NotificationEntity | null> {
        return this.notificationRepository.markAsRead(id);
    }

    async markAll(userId: string): Promise<void> {
        return this.notificationRepository.markAllAsRead(userId);
    }
}
