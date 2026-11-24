import type { UserEntity } from "@domain/entities/UserEntity";

export interface GetUserProfileInputDto {
    userId: string;
}

export type GetUserProfileResultDto = UserEntity;
export type GetUserProfileOutputDto = UserEntity | null;
