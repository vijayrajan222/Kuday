import type { UserEntity } from "@domain/entities/UserEntity";

export interface IGetUserProfileUseCase {
    execute(userId: string): Promise<UserEntity | null>;
}
