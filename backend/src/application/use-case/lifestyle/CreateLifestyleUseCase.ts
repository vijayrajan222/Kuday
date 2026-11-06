import type { ILifestyleRepository } from "@application/interfaces/repository/ILifestyleRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ICreateLifestyleUseCase } from "@application/interfaces/use-case/lifestyle/ICreateLifestyleUseCase";
import type { CreateLifestyleDto } from "@application/dto/lifestyle/CreateLifestyleDto";
import type { LifestyleEntity } from "@domain/entities/LifestyleEntity";

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
