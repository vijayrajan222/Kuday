import type { NotificationEntity } from "@domain/entities/NotificationEntity";
import type { GetNotificationsDto, GetNotificationsOutputDto } from "@application/dto/notification/CreateNotificationDto";

export type { GetNotificationsDto, GetNotificationsOutputDto };

export interface IGetNotificationsUseCase {
    execute(dto: GetNotificationsDto): Promise<GetNotificationsOutputDto>;
    execute(userId: string): Promise<GetNotificationsOutputDto>;
    execute(dtoOrUserId: GetNotificationsDto | string): Promise<GetNotificationsOutputDto>;
}
