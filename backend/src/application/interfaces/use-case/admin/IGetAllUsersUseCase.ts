import type { UserEntity } from "../../../../domain/entities/UserEntity.js";

export interface IGetAllUsersUseCase {
    execute(): Promise<UserEntity[]>;
}
