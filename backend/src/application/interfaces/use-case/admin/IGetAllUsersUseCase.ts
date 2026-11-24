import type { GetAllUsersInputDto, GetAllUsersOutputDto } from "@application/dto/admin/GetAllUsersDto";
import type { UserEntity } from "@domain/entities/UserEntity";

export type { GetAllUsersInputDto, GetAllUsersOutputDto, UserEntity };

export interface IGetAllUsersUseCase {
    execute(input?: GetAllUsersInputDto | string): Promise<GetAllUsersOutputDto>;
}
