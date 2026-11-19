import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const ClauseDraftResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  clauseText: z.string().optional(),
  conflictsWithBaseTerms: z.boolean().optional(),
});

export type ClauseDraftResult = z.infer<typeof ClauseDraftResultSchema>;

export interface BaseTermsSummary {
  rent?: number | undefined;
  deposit?: number | undefined;
  moveInDate?: string | undefined;
  durationMonths?: number | undefined;
  noticePeriodDays?: number | undefined;
  paymentDueDay?: number | undefined;
  utilities?: string | string[] | undefined;
}

const SYSTEM_INSTRUCTION = `You draft rental agreement clauses for a room-rental app in India.
Rewrite the request as one formal, neutral, enforceable-sounding clause suitable for a residential rental agreement under Indian laws.
Refuse discriminatory clauses (based on caste, religion, gender, sexual orientation, marital status, or nationality) or illegal clauses (e.g. unlawful detention of property, illegal eviction without notice).
If the request is discriminatory or illegal, set "allowed" to false and provide a polite "reason".
If the proposed clause directly contradicts the standard terms provided (such as demanding higher rent or conflicting payment due dates), set "conflictsWithBaseTerms" to true and briefly explain in "reason".
Output strictly valid JSON matching this schema:
{
  "allowed": boolean,
  "reason"?: string,
  "clauseText"?: string,
  "conflictsWithBaseTerms"?: boolean
}`;

/**
 * Drafts a formal rental agreement clause from a plain-language request using Google Gemini.
 * Never exposes personal data or keys to outside callers.
 */
export async function draftClause(
  userNeed: string,
  baseTerms?: BaseTermsSummary
): Promise<ClauseDraftResult> {
  const sanitizedNeed = (userNeed || "").trim().slice(0, 500);
  if (!sanitizedNeed) {
    return {
      allowed: false,
      reason: "Please provide a plain-language description for your clause (up to 500 characters).",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      allowed: false,
      reason: "AI clause drafter is currently unconfigured. You may type and edit your clause manually.",
    };
  }

  const preferredModel = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const candidateModels = Array.from(
    new Set([
      preferredModel,
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-2.5-flash-lite",
    ])
  );

  const safeTerms: BaseTermsSummary = {
    rent: baseTerms?.rent,
    deposit: baseTerms?.deposit,
    moveInDate: baseTerms?.moveInDate,
    durationMonths: baseTerms?.durationMonths,
    noticePeriodDays: baseTerms?.noticePeriodDays,
    paymentDueDay: baseTerms?.paymentDueDay,
    utilities: Array.isArray(baseTerms?.utilities)
      ? baseTerms.utilities.slice(0, 10)
      : typeof baseTerms?.utilities === "string"
      ? baseTerms.utilities.slice(0, 200)
      : undefined,
  };

  const promptPayload = JSON.stringify({
    userNeed: sanitizedNeed,
    standardTerms: safeTerms,
  });

  const ai = new GoogleGenAI({ apiKey });

  let lastError: Error | null = null;

  for (const modelName of candidateModels) {
    try {
      const abortPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini AI request timed out after 15 seconds")), 15000)
      );

      const requestPromise = ai.models.generateContent({
        model: modelName,
        contents: promptPayload,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const response = await Promise.race([requestPromise, abortPromise]);
      const rawText = (response?.text || "").trim();

      if (!rawText) {
        throw new Error("Empty response received from AI model");
      }

      // Parse JSON safely
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        // Strip markdown fences if present
        const cleaned = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        parsedJson = JSON.parse(cleaned);
      }

      const validated = ClauseDraftResultSchema.safeParse(parsedJson);
      if (validated.success) {
        return validated.data;
      }

      return {
        allowed: false,
        reason: "Could not format AI response. You may type and submit your clause manually.",
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If model not found or service unavailable, try next candidate
      continue;
    }
  }

  return {
    allowed: false,
    reason:
      lastError?.message?.includes("timed out")
        ? "AI drafter timed out. Please enter your custom clause manually."
        : "AI drafter is temporarily unavailable. You can write your custom clause manually.",
  };
}
