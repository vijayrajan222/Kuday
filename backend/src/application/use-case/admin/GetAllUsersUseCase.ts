import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { UserEntity } from "../../../domain/entities/UserEntity.js";
import type { IGetAllUsersUseCase } from "../../interfaces/use-case/admin/IGetAllUsersUseCase.js";

export class GetAllUsersUseCase implements IGetAllUsersUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(): Promise<UserEntity[]> {
        return this.userRepository.findAll();
    }
}
