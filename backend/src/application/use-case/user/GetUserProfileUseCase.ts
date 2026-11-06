import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { UserEntity } from "@domain/entities/UserEntity";
import type { IGetUserProfileUseCase } from "@application/interfaces/use-case/user/IGetUserProfileUseCase";

export class GetUserProfileUseCase implements IGetUserProfileUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(userId: string): Promise<UserEntity | null> {
        return this.userRepository.findById(userId);
    }
}
