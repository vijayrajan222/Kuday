import type { DraftClauseResponseDto } from "@application/dto/agreement/DraftClauseDto";

export interface IDraftClauseUseCase {
  execute(userId: string, agreementId: string, userNeed: string): Promise<DraftClauseResponseDto>;
}
