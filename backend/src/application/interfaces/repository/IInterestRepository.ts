import type { InterestEntity, InterestStatus } from "@domain/entities/InterestEntity";

export interface IInterestRepository {
    create(data: Omit<InterestEntity, "id">): Promise<InterestEntity>;
    findById(id: string): Promise<InterestEntity | null>;
    findBySenderReceiverTarget(
        senderId: string,
        receiverId: string,
        targetId: string
    ): Promise<InterestEntity | null>;
    findByReceiverId(receiverId: string): Promise<InterestEntity[]>;
    findBySenderId(senderId: string): Promise<InterestEntity[]>;
    findBetweenUsers(userA: string, userB: string): Promise<InterestEntity[]>;
    findAcceptedBetween(userA: string, userB: string): Promise<InterestEntity | null>;
    updateStatus(id: string, status: InterestStatus): Promise<InterestEntity | null>;
    updateStatusBetweenUsers(
        userA: string,
        userB: string,
        status: InterestStatus
    ): Promise<void>;
}
