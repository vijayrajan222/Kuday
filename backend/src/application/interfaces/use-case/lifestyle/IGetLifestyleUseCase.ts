import type { LifestyleEntity } from "@domain/entities/LifestyleEntity";
import type { GetLifestyleDto, GetLifestyleOutputDto } from "@application/dto/lifestyle/CreateLifestyleDto";

export type { GetLifestyleDto, GetLifestyleOutputDto };

export interface IGetLifestyleUseCase {
    execute(dto: GetLifestyleDto): Promise<GetLifestyleOutputDto>;
    execute(userId: string): Promise<GetLifestyleOutputDto>;
    execute(dtoOrUserId: GetLifestyleDto | string): Promise<GetLifestyleOutputDto>;
}
