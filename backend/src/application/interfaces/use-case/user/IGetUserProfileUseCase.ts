import type { UserEntity } from "@domain/entities/UserEntity";
import type {
    GetUserProfileInputDto,
    GetUserProfileResultDto,
    GetUserProfileOutputDto,
} from "@application/dto/user/GetUserProfileDto";

export type { GetUserProfileInputDto, GetUserProfileResultDto, GetUserProfileOutputDto };

export interface IGetUserProfileUseCase {
    execute(dto: GetUserProfileInputDto): Promise<GetUserProfileOutputDto>;
    execute(userId: string): Promise<GetUserProfileOutputDto>;
    execute(dtoOrUserId: GetUserProfileInputDto | string): Promise<GetUserProfileOutputDto>;
}
