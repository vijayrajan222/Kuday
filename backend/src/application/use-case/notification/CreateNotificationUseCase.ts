import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository.js";
import type { NotificationEntity } from "@domain/entities/NotificationEntity.js";
import type { ICreateNotificationUseCase } from "@application/interfaces/use-case/notification/ICreateNotificationUseCase.js";
import type { CreateNotificationRequestDto } from "@application/dto/notification/CreateNotificationDto.js";

export class CreateNotificationUseCase implements ICreateNotificationUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async execute(dto: CreateNotificationRequestDto): Promise<NotificationEntity> {
        return this.notificationRepository.create({
            userId: dto.userId,
            title: dto.title,
            message: dto.message,
            type: dto.type,
            isRead: false,
        });
    }
}
