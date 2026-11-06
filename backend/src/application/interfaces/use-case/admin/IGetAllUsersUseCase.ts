import type { UserEntity } from "@domain/entities/UserEntity";

export interface IGetAllUsersUseCase {
    execute(search?: string): Promise<UserEntity[]>;
}
