import type { VisitDetailDto } from "@application/dto/visit/VisitDetailDto";

export interface IGetVisitsUseCase {
    getByConnectionId(connectionId: string): Promise<VisitDetailDto[]>;
    getByUserId(userId: string): Promise<VisitDetailDto[]>;
}
