import type { VisitStatus } from "@domain/entities/VisitEntity";

export interface UpdateVisitStatusDto {
    visitId: string;
    userId: string;
    status: VisitStatus; // 'confirmed' | 'cancelled' | 'completed'
    note?: string | undefined;
}
