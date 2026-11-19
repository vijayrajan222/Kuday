import type { AgreementEntity } from "@domain/entities/AgreementEntity";

export interface IAgreementRepository {
    create(data: Omit<AgreementEntity, "id">): Promise<AgreementEntity>;
    findById(id: string): Promise<AgreementEntity | null>;
    findActive(hostId: string, seekerId: string, roomId: string): Promise<AgreementEntity | null>;
    update(id: string, updates: Partial<AgreementEntity>): Promise<AgreementEntity | null>;
    findByUser(userId: string): Promise<AgreementEntity[]>;
    findByOrderId(orderId: string): Promise<AgreementEntity | null>;
    findActiveAgreementUserIds(): Promise<Set<string>>;
    findActiveSeekerIds(): Promise<Set<string>>;
    markCompletedAtomic(id: string, updates: Partial<AgreementEntity>): Promise<AgreementEntity | null>;
    markTerminatedAtomic(id: string, targetStatus: "ended" | "cancelled"): Promise<AgreementEntity | null>;
}
