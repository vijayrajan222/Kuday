import type {
  DraftClauseDto,
  DraftClauseInputDto,
  DraftClauseResponseDto,
} from "@application/dto/agreement/DraftClauseDto";

export type { DraftClauseDto, DraftClauseInputDto, DraftClauseResponseDto };

export interface IDraftClauseUseCase {
  execute(input: DraftClauseInputDto): Promise<DraftClauseResponseDto>;
  execute(userId: string, agreementId: string, userNeed: string): Promise<DraftClauseResponseDto>;
  execute(
    inputOrUserId: DraftClauseInputDto | string,
    agreementId?: string,
    userNeed?: string
  ): Promise<DraftClauseResponseDto>;
}
