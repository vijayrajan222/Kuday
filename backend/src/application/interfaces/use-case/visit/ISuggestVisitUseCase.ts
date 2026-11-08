import type { SuggestVisitDto } from "@application/dto/visit/SuggestVisitDto";
import type { VisitEntity } from "@domain/entities/VisitEntity";

export interface ISuggestVisitUseCase {
    execute(dto: SuggestVisitDto): Promise<VisitEntity>;
}
