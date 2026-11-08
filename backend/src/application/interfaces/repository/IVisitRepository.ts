import type { VisitEntity, VisitStatus } from "@domain/entities/VisitEntity";

export interface IVisitRepository {
    create(data: Omit<VisitEntity, "id" | "createdAt" | "updatedAt">): Promise<VisitEntity>;
    findById(id: string): Promise<VisitEntity | null>;
    findByConnectionId(connectionId: string): Promise<VisitEntity[]>;
    findByUserId(userId: string): Promise<VisitEntity[]>;
    updateStatus(id: string, status: VisitStatus): Promise<VisitEntity | null>;
    updateSuggestion(
        id: string,
        data: {
            suggestedBy: "seeker" | "host";
            suggestedById?: string;
            suggestedDate: string;
            suggestedTimeSlot: "morning" | "afternoon" | "evening";
            suggestedSlotTime: string;
            suggestedMessage?: string;
            status: "rescheduled";
        }
    ): Promise<VisitEntity | null>;
    applySuggestion(id: string): Promise<VisitEntity | null>;
}
