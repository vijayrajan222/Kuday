import { GeminiClauseDrafterService } from "@infrastructure/services/GeminiClauseDrafterService";
import type {
  BaseTermsSummary,
  ClauseDraftResult,
} from "@application/interfaces/services/IClauseDrafterService";

export { ClauseDraftResultSchema } from "@infrastructure/services/GeminiClauseDrafterService";
export type { BaseTermsSummary, ClauseDraftResult };

const defaultService = new GeminiClauseDrafterService();

/**
 * Drafts a formal rental agreement clause from a plain-language request using Google Gemini.
 * @deprecated Prefer injecting IClauseDrafterService via Clean Architecture dependency injection.
 */
export async function draftClause(
  userNeed: string,
  baseTerms?: BaseTermsSummary
): Promise<ClauseDraftResult> {
  return defaultService.draftClause(userNeed, baseTerms);
}
