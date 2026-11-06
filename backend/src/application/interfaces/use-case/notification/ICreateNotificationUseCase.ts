import type { CreateNotificationRequestDto } from "@application/dto/notification/CreateNotificationDto";
import type { NotificationEntity } from "@domain/entities/NotificationEntity";

export interface ICreateNotificationUseCase {
    execute(dto: CreateNotificationRequestDto): Promise<NotificationEntity>;
}
