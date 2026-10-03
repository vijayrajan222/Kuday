import type { IUpdateRoleUseCase } from "../../interfaces/use-case/user/IUpdateRoleUseCase.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { UpdateRoleDto } from "../../dto/user/UpdateRoleDto.js";
import type { UserEntity } from "../../../domain/entities/UserEntity.js";

export class UpdateRoleUseCase implements IUpdateRoleUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(dto: UpdateRoleDto): Promise<UserEntity> {
        const { userId, role } = dto;
        const updatedUser = await this.userRepository.updateProfile(userId, { role });
        if (!updatedUser) {
            throw new Error("User not found");
        }
        return updatedUser;
    }
}
