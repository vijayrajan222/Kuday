import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import type { UserEntity } from "@domain/entities/UserEntity.js";
import type { IGetAllUsersUseCase } from "@application/interfaces/use-case/admin/IGetAllUsersUseCase.js";

export class GetAllUsersUseCase implements IGetAllUsersUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(search?: string): Promise<UserEntity[]> {
        return this.userRepository.findAll(search);
    }
}
