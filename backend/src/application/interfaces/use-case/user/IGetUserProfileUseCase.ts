import type { UserEntity } from "../../../../domain/entities/UserEntity.js";

export interface IGetUserProfileUseCase {
    execute(userId: string): Promise<UserEntity | null>;
}
