import type { INotificationRepository } from "../../interfaces/repository/INotificationRepository.js";
import type { NotificationEntity } from "../../../domain/entities/NotificationEntity.js";
import type { IMarkNotificationReadUseCase } from "../../interfaces/use-case/notification/IMarkNotificationReadUseCase.js";

export class MarkNotificationReadUseCase implements IMarkNotificationReadUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async markSingle(id: string): Promise<NotificationEntity | null> {
        return this.notificationRepository.markAsRead(id);
    }

    async markAll(userId: string): Promise<void> {
        return this.notificationRepository.markAllAsRead(userId);
    }
}
