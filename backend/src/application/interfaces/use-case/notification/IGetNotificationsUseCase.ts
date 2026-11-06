import type { NotificationEntity } from "@domain/entities/NotificationEntity";

export interface IGetNotificationsUseCase {
    execute(userId: string): Promise<NotificationEntity[]>;
}
