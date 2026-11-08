import type { InterestTargetType } from "@domain/entities/InterestEntity";

export interface SendInterestDto {
    senderId: string;
    receiverId: string;
    targetType: InterestTargetType;
    targetId: string;
    message?: string | undefined;
}
