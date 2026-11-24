import type { IGetLifestyleUseCase } from "@application/interfaces/use-case/lifestyle/IGetLifestyleUseCase";
import type { ILifestyleRepository } from "@application/interfaces/repository/ILifestyleRepository";
import type { GetLifestyleDto, GetLifestyleOutputDto } from "@application/dto/lifestyle/CreateLifestyleDto";

export class GetLifestyleUseCase implements IGetLifestyleUseCase {
    constructor(private lifestyleRepository: ILifestyleRepository) {}

    async execute(dtoOrUserId: GetLifestyleDto | string): Promise<GetLifestyleOutputDto> {
        const userId = typeof dtoOrUserId === "object" ? dtoOrUserId.userId : dtoOrUserId;
        return this.lifestyleRepository.findByUserId(userId);
    }
}
