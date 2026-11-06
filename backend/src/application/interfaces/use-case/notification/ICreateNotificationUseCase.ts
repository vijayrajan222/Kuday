import type { CreateNotificationRequestDto } from "@application/dto/notification/CreateNotificationDto.js";
import type { NotificationEntity } from "@domain/entities/NotificationEntity.js";

export interface ICreateNotificationUseCase {
    execute(dto: CreateNotificationRequestDto): Promise<NotificationEntity>;
}
