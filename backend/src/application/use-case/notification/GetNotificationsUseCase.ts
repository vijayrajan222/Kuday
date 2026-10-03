import type { INotificationRepository } from "../../interfaces/repository/INotificationRepository.js";
import type { NotificationEntity } from "../../../domain/entities/NotificationEntity.js";

export class GetNotificationsUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async execute(userId: string): Promise<NotificationEntity[]> {
        return this.notificationRepository.findByUserId(userId);
    }
}
