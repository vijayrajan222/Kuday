
import type { UpdateProfileDto } from "@application/dto/user/UpdateProfileDto";
import type { UserEntity } from "@domain/entities/UserEntity";
export interface IUpdateProfileUseCase {
    execute(dto: UpdateProfileDto): Promise<UserEntity>;
}