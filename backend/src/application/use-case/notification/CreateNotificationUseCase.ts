import type { INotificationRepository } from "../../interfaces/repository/INotificationRepository.js";
import type { NotificationEntity } from "../../../domain/entities/NotificationEntity.js";

export interface CreateNotificationDto {
    userId: string;
    title: string;
    message: string;
    type: "admin_verification" | "interest_request" | "system";
}

export class CreateNotificationUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async execute(dto: CreateNotificationDto): Promise<NotificationEntity> {
        return this.notificationRepository.create({
            userId: dto.userId,
            title: dto.title,
            message: dto.message,
            type: dto.type,
            isRead: false,
        });
    }
}
