import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { UserEntity } from "../../../domain/entities/UserEntity.js";
import type { IGetUserProfileUseCase } from "../../interfaces/use-case/user/IGetUserProfileUseCase.js";

export class GetUserProfileUseCase implements IGetUserProfileUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(userId: string): Promise<UserEntity | null> {
        return this.userRepository.findById(userId);
    }
}
