export interface BaseTermsSummary {
  rent?: number | undefined;
  deposit?: number | undefined;
  moveInDate?: string | undefined;
  durationMonths?: number | undefined;
  noticePeriodDays?: number | undefined;
  paymentDueDay?: number | undefined;
  utilities?: string | string[] | undefined;
}

export interface ClauseDraftResult {
  allowed: boolean;
  reason?: string | undefined;
  clauseText?: string | undefined;
  conflictsWithBaseTerms?: boolean | undefined;
}

export interface IClauseDrafterService {
  draftClause(userNeed: string, baseTerms?: BaseTermsSummary): Promise<ClauseDraftResult>;
}
