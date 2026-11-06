
import type { UpdateProfileDto } from "@application/dto/user/UpdateProfileDto.js";
import type { UserEntity } from "@domain/entities/UserEntity.js";
export interface IUpdateProfileUseCase {
    execute(dto: UpdateProfileDto): Promise<UserEntity>;
}