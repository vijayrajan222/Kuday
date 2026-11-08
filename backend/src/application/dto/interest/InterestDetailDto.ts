import type { InterestStatus, InterestTargetType } from "@domain/entities/InterestEntity";

export interface InterestDetailDto {
    id: string;
    senderId: string;
    receiverId: string;
    targetType: InterestTargetType;
    targetId: string;
    status: InterestStatus;
    message?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    sender?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        selfieUrl?: string | undefined;
        role?: string | undefined;
    } | undefined;
    receiver?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        selfieUrl?: string | undefined;
        role?: string | undefined;
    } | undefined;
    targetTitle?: string | undefined;
}
