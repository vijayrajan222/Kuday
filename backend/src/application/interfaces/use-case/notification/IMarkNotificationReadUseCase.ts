import type { NotificationEntity } from "@domain/entities/NotificationEntity";
import type { MarkNotificationReadDto } from "@application/dto/notification/CreateNotificationDto";

export type { MarkNotificationReadDto };

export interface IMarkNotificationReadUseCase {
    markSingle(id: string): Promise<NotificationEntity | null>;
    markSingle(dto: MarkNotificationReadDto): Promise<NotificationEntity | null>;
    markSingle(idOrDto: string | MarkNotificationReadDto): Promise<NotificationEntity | null>;
    markAll(userId: string): Promise<void>;
    markAll(dto: MarkNotificationReadDto): Promise<void>;
    markAll(userIdOrDto: string | MarkNotificationReadDto): Promise<void>;
}
