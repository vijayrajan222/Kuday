import type { NotificationEntity } from "@domain/entities/NotificationEntity";

export interface CreateNotificationRequestDto {
    userId: string;
    title: string;
    message: string;
    type: "admin_verification" | "interest_request" | "system" | "chat_message" | "visit_request";
}

export interface GetNotificationsDto {
    userId: string;
}

export interface MarkNotificationReadDto {
    id?: string | undefined;
    userId?: string | undefined;
}

export type GetNotificationsOutputDto = NotificationEntity[];
