import type { IUpdateRoleUseCase } from "@application/interfaces/use-case/user/IUpdateRoleUseCase.js";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository.js";
import type { ISeekerPreferenceRepository } from "@application/interfaces/repository/ISeekerPreferenceRepository.js";
import type { UpdateRoleDto } from "@application/dto/user/UpdateRoleDto.js";
import type { UserEntity } from "@domain/entities/UserEntity.js";

export class UpdateRoleUseCase implements IUpdateRoleUseCase {
    constructor(
        private userRepository: IUserRepository,
        private roomRepository?: IRoomRepository,
        private seekerPreferenceRepository?: ISeekerPreferenceRepository
    ) {}

    async execute(dto: UpdateRoleDto): Promise<UserEntity> {
        const { userId, role } = dto;
        const updatedUser = await this.userRepository.updateProfile(userId, { role });
        if (!updatedUser) {
            throw new Error("User not found");
        }

        // Toggle active listing status for host and seeker posts
        if (role === "host") {
            if (this.roomRepository) {
                await this.roomRepository.updateStatusByHostId(userId, true);
            }
            if (this.seekerPreferenceRepository) {
                await this.seekerPreferenceRepository.updateStatusByUserId(userId, false);
            }
        } else if (role === "seeker") {
            if (this.roomRepository) {
                await this.roomRepository.updateStatusByHostId(userId, false);
            }
            if (this.seekerPreferenceRepository) {
                await this.seekerPreferenceRepository.updateStatusByUserId(userId, true);
            }
        }

        return updatedUser;
    }
}
