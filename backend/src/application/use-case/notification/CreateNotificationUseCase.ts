import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { NotificationEntity } from "@domain/entities/NotificationEntity";
import type { ICreateNotificationUseCase } from "@application/interfaces/use-case/notification/ICreateNotificationUseCase";
import type { CreateNotificationRequestDto } from "@application/dto/notification/CreateNotificationDto";

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
