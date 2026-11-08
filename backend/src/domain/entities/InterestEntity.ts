export type InterestStatus = "pending" | "accepted" | "declined";
export type InterestTargetType = "room" | "seeker";

export interface InterestEntity {
    id: string;
    senderId: string;
    receiverId: string;
    targetType: InterestTargetType;
    targetId: string;
    status: InterestStatus;
    message?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
