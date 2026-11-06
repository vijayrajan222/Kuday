import type { UserEntity } from "@domain/entities/UserEntity.js";
import type { UpdateRoleDto } from "@application/dto/user/UpdateRoleDto.js";

export interface IUpdateRoleUseCase {
    execute(dto: UpdateRoleDto): Promise<UserEntity>;
}
