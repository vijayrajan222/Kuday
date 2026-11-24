import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IGetUserProfileUseCase } from "@application/interfaces/use-case/user/IGetUserProfileUseCase";
import type {
    GetUserProfileInputDto,
    GetUserProfileOutputDto,
} from "@application/dto/user/GetUserProfileDto";

export class GetUserProfileUseCase implements IGetUserProfileUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(dtoOrUserId: GetUserProfileInputDto | string): Promise<GetUserProfileOutputDto> {
        const userId = typeof dtoOrUserId === "object" ? dtoOrUserId.userId : dtoOrUserId;
        return this.userRepository.findById(userId);
    }
}
