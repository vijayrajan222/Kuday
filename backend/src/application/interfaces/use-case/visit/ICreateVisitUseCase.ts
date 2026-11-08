import type { CreateVisitDto } from "@application/dto/visit/CreateVisitDto";
import type { VisitEntity } from "@domain/entities/VisitEntity";

export interface ICreateVisitUseCase {
    execute(dto: CreateVisitDto): Promise<VisitEntity>;
}
