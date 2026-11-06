import type { VerifyUserIdentityRequestDto, VerifyUserIdentityResultDto } from "@application/dto/admin/VerifyUserIdentityDto";

export interface IVerifyUserIdentityUseCase {
    execute(input: VerifyUserIdentityRequestDto): Promise<VerifyUserIdentityResultDto>;
}
