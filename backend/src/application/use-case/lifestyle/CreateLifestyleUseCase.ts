import type { ILifestyleRepository } from "../../interfaces/repository/ILifestyleRepository.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { ICreateLifestyleUseCase } from "../../interfaces/use-case/lifestyle/ICreateLifestyleUseCase.js";
import type { CreateLifestyleDto } from "../../dto/lifestyle/CreateLifestyleDto.js";
import type { LifestyleEntity } from "../../../domain/entities/LifestyleEntity.js";

export class CreateLifestyleUseCase implements ICreateLifestyleUseCase {
    constructor(
        private lifestyleRepository: ILifestyleRepository,
        private userRepository: IUserRepository
    ) {}

    async execute(dto: CreateLifestyleDto): Promise<LifestyleEntity> {
        const user = await this.userRepository.findById(dto.userId);
        if (!user) {
            throw new Error("User not found");
        }

        return await this.lifestyleRepository.upsert({
            userId: dto.userId,
            smoking: dto.smoking,
            drinking: dto.drinking,
            sleepSchedule: dto.sleepSchedule,
            diet: dto.diet,
            cleanliness: dto.cleanliness,
            visitorPolicy: dto.visitorPolicy,
            roommateGenderPref: dto.roommateGenderPref
        });
    }
}
