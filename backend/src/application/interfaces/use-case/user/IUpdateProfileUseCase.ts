
import type { UpdateProfileDto } from "../../../dto/user/UpdateProfileDto.js";
import type { UserEntity } from "../../../../domain/entities/UserEntity.js";
export interface IUpdateProfileUseCase {
    execute(dto: UpdateProfileDto): Promise<UserEntity>;
}