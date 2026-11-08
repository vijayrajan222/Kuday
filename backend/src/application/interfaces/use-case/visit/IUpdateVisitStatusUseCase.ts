import type { UpdateVisitStatusDto } from "@application/dto/visit/UpdateVisitStatusDto";
import type { VisitEntity } from "@domain/entities/VisitEntity";

export interface IUpdateVisitStatusUseCase {
    execute(dto: UpdateVisitStatusDto): Promise<VisitEntity>;
    acceptSuggestion(visitId: string, userId: string): Promise<VisitEntity>;
}
