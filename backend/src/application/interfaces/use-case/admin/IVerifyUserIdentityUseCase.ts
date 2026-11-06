import type { VerifyUserIdentityRequestDto, VerifyUserIdentityResultDto } from "@application/dto/admin/VerifyUserIdentityDto.js";

export interface IVerifyUserIdentityUseCase {
    execute(input: VerifyUserIdentityRequestDto): Promise<VerifyUserIdentityResultDto>;
}
