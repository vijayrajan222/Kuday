import type { UserEntity } from "../../../../domain/entities/UserEntity.js";

export interface IGetAllUsersUseCase {
    execute(search?: string): Promise<UserEntity[]>;
}
