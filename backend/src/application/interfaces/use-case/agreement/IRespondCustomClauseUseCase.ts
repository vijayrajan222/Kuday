import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { RespondCustomClauseDto } from "@application/dto/agreement/RespondCustomClauseDto";

export interface IRespondCustomClauseUseCase {
  execute(
    userId: string,
    agreementId: string,
    clauseId: string,
    dto: RespondCustomClauseDto
  ): Promise<AgreementResponseDto>;
}
