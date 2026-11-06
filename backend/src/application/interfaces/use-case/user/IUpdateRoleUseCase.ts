import type { UserEntity } from "@domain/entities/UserEntity";
import type { UpdateRoleDto } from "@application/dto/user/UpdateRoleDto";

export interface IUpdateRoleUseCase {
    execute(dto: UpdateRoleDto): Promise<UserEntity>;
}
