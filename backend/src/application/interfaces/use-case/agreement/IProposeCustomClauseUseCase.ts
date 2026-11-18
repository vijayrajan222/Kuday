import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { ProposeCustomClauseDto } from "@application/dto/agreement/ProposeCustomClauseDto";

export interface IProposeCustomClauseUseCase {
  execute(
    userId: string,
    agreementId: string,
    dto: ProposeCustomClauseDto
  ): Promise<AgreementResponseDto>;
}
