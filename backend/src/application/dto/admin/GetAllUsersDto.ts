import type { UserEntity } from "@domain/entities/UserEntity";

export interface GetAllUsersInputDto {
    search?: string | undefined;
}

export type GetAllUsersOutputDto = UserEntity[];
