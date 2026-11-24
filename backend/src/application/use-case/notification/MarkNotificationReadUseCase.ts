import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { NotificationEntity } from "@domain/entities/NotificationEntity";
import type { IMarkNotificationReadUseCase } from "@application/interfaces/use-case/notification/IMarkNotificationReadUseCase";
import type { MarkNotificationReadDto } from "@application/dto/notification/CreateNotificationDto";

export class MarkNotificationReadUseCase implements IMarkNotificationReadUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async markSingle(idOrDto: string | MarkNotificationReadDto): Promise<NotificationEntity | null> {
        const id = typeof idOrDto === "object" ? idOrDto.id! : idOrDto;
        return this.notificationRepository.markAsRead(id);
    }

    async markAll(userIdOrDto: string | MarkNotificationReadDto): Promise<void> {
        const userId = typeof userIdOrDto === "object" ? userIdOrDto.userId! : userIdOrDto;
        return this.notificationRepository.markAllAsRead(userId);
    }
}
