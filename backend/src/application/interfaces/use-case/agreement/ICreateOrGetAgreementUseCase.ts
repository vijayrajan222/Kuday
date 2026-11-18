import type { CreateAgreementRequestDto } from "@application/dto/agreement/CreateAgreementDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface ICreateOrGetAgreementUseCase {
    execute(dto: CreateAgreementRequestDto, callerUserId: string): Promise<AgreementResponseDto>;
}
