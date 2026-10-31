import type { NotificationEntity } from "../../../../domain/entities/NotificationEntity.js";

export interface IGetNotificationsUseCase {
    execute(userId: string): Promise<NotificationEntity[]>;
}
