import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { NotificationEntity } from "@domain/entities/NotificationEntity";
import type { IGetNotificationsUseCase } from "@application/interfaces/use-case/notification/IGetNotificationsUseCase";

export class GetNotificationsUseCase implements IGetNotificationsUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async execute(userId: string): Promise<NotificationEntity[]> {
        return this.notificationRepository.findByUserId(userId);
    }
}
