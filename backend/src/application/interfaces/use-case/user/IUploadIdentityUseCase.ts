import type { UploadIdentityDto } from "@application/dto/user/UploadIdentityDto.js";
import type { UserEntity } from "@domain/entities/UserEntity.js";

export interface IUploadIdentityUseCase {
    execute(dto: UploadIdentityDto): Promise<UserEntity>;
}
