import type { IDraftClauseUseCase } from "@application/interfaces/use-case/agreement/IDraftClauseUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { DraftClauseResponseDto } from "@application/dto/agreement/DraftClauseDto";
import { AppError } from "@application/errors/AppError";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";
import { draftClause } from "../../../services/ai/clauseDrafter";

const DISCLAIMER = "AI-drafted clause. Not legal advice. Please review carefully.";

export class DraftClauseUseCase implements IDraftClauseUseCase {
  constructor(private readonly agreementRepository: IAgreementRepository) {}

  async execute(
    userId: string,
    agreementId: string,
    userNeed: string
  ): Promise<DraftClauseResponseDto> {
    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new AppError("Agreement not found", HttpStatusCodes.NOT_FOUND);
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new AppError("You are not authorized to draft clauses for this agreement", HttpStatusCodes.FORBIDDEN);
    }

    if (agreement.status === "signed" || agreement.status === "cancelled") {
      throw new AppError("Cannot draft clauses for locked or cancelled agreements", HttpStatusCodes.BAD_REQUEST);
    }

    const baseTerms = agreement.commonTerms
      ? {
          rent: agreement.commonTerms.rent,
          deposit: agreement.commonTerms.deposit,
          moveInDate: agreement.commonTerms.moveInDate,
          durationMonths: agreement.commonTerms.durationMonths,
          noticePeriodDays: agreement.commonTerms.noticePeriodDays,
          paymentDueDay: agreement.commonTerms.paymentDueDay,
          utilities: agreement.commonTerms.utilities,
        }
      : undefined;

    const draftResult = await draftClause(userNeed, baseTerms);

    return {
      allowed: draftResult.allowed,
      reason: draftResult.reason,
      clauseText: draftResult.clauseText,
      conflictsWithBaseTerms: draftResult.conflictsWithBaseTerms,
      disclaimer: DISCLAIMER,
    };
  }
}
