export interface DraftClauseDto {
  userNeed: string;
}

export interface DraftClauseResponseDto {
  allowed: boolean;
  reason?: string | undefined;
  clauseText?: string | undefined;
  conflictsWithBaseTerms?: boolean | undefined;
  disclaimer: string;
}
