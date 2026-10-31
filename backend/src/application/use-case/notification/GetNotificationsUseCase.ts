import type { INotificationRepository } from "../../interfaces/repository/INotificationRepository.js";
import type { NotificationEntity } from "../../../domain/entities/NotificationEntity.js";
import type { IGetNotificationsUseCase } from "../../interfaces/use-case/notification/IGetNotificationsUseCase.js";

export class GetNotificationsUseCase implements IGetNotificationsUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async execute(userId: string): Promise<NotificationEntity[]> {
        return this.notificationRepository.findByUserId(userId);
    }
}
