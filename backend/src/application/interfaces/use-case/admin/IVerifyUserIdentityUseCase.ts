import type { VerifyUserIdentityRequestDto, VerifyUserIdentityResultDto } from "../../../dto/admin/VerifyUserIdentityDto.js";

export interface IVerifyUserIdentityUseCase {
    execute(input: VerifyUserIdentityRequestDto): Promise<VerifyUserIdentityResultDto>;
}
