import type { UploadIdentityDto } from "@application/dto/user/UploadIdentityDto";
import type { UserEntity } from "@domain/entities/UserEntity";

export interface IUploadIdentityUseCase {
    execute(dto: UploadIdentityDto): Promise<UserEntity>;
}
