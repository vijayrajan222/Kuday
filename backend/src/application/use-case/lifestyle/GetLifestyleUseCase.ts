import type { IGetLifestyleUseCase } from "@application/interfaces/use-case/lifestyle/IGetLifestyleUseCase";
import type { ILifestyleRepository } from "@application/interfaces/repository/ILifestyleRepository";
import type { LifestyleEntity } from "@domain/entities/LifestyleEntity";

export class GetLifestyleUseCase implements IGetLifestyleUseCase {
    constructor(private lifestyleRepository: ILifestyleRepository) {}

    async execute(userId: string): Promise<LifestyleEntity | null> {
        return this.lifestyleRepository.findByUserId(userId);
    }
}
