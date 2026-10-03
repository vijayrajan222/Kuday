import type { IGetLifestyleUseCase } from "../../interfaces/use-case/lifestyle/IGetLifestyleUseCase.js";
import type { ILifestyleRepository } from "../../interfaces/repository/ILifestyleRepository.js";
import type { LifestyleEntity } from "../../../domain/entities/LifestyleEntity.js";

export class GetLifestyleUseCase implements IGetLifestyleUseCase {
    constructor(private lifestyleRepository: ILifestyleRepository) {}

    async execute(userId: string): Promise<LifestyleEntity | null> {
        return this.lifestyleRepository.findByUserId(userId);
    }
}
