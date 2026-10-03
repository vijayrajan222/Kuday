import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { UserEntity } from "../../../domain/entities/UserEntity.js";

export class GetAllUsersUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(): Promise<UserEntity[]> {
        return this.userRepository.findAll();
    }
}
