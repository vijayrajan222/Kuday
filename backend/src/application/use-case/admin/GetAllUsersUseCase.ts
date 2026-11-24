import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IGetAllUsersUseCase } from "@application/interfaces/use-case/admin/IGetAllUsersUseCase";
import type { GetAllUsersInputDto, GetAllUsersOutputDto } from "@application/dto/admin/GetAllUsersDto";

export class GetAllUsersUseCase implements IGetAllUsersUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(input?: GetAllUsersInputDto | string): Promise<GetAllUsersOutputDto> {
        const search = typeof input === "object" ? input?.search : input;
        return this.userRepository.findAll(search);
    }
}
