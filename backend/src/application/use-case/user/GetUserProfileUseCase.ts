import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import type { UserEntity } from "@domain/entities/UserEntity.js";
import type { IGetUserProfileUseCase } from "@application/interfaces/use-case/user/IGetUserProfileUseCase.js";

export class GetUserProfileUseCase implements IGetUserProfileUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(userId: string): Promise<UserEntity | null> {
        return this.userRepository.findById(userId);
    }
}
