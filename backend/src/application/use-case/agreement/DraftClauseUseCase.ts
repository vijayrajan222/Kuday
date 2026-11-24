import type { IDraftClauseUseCase } from "@application/interfaces/use-case/agreement/IDraftClauseUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IClauseDrafterService } from "@application/interfaces/services/IClauseDrafterService";
import type {
  DraftClauseInputDto,
  DraftClauseResponseDto,
} from "@application/dto/agreement/DraftClauseDto";
import { NotFoundError, ForbiddenError, ValidationError } from "@application/errors/AppError";

const DISCLAIMER = "AI-drafted clause. Not legal advice. Please review carefully.";

export class DraftClauseUseCase implements IDraftClauseUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly clauseDrafterService: IClauseDrafterService
  ) {}

  async execute(
    inputOrUserId: DraftClauseInputDto | string,
    rawAgreementId?: string,
    rawUserNeed?: string
  ): Promise<DraftClauseResponseDto> {
    const userId = typeof inputOrUserId === "object" ? inputOrUserId.userId : inputOrUserId;
    const agreementId = typeof inputOrUserId === "object" ? inputOrUserId.agreementId : rawAgreementId!;
    const userNeed = typeof inputOrUserId === "object" ? inputOrUserId.userNeed : rawUserNeed!;

    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundError("Agreement not found");
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new ForbiddenError("You are not authorized to draft clauses for this agreement");
    }

    if (agreement.status === "completed" || agreement.status === "cancelled") {
      throw new ValidationError("Cannot draft clauses for locked or cancelled agreements");
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

    const draftResult = await this.clauseDrafterService.draftClause(userNeed, baseTerms);

    return {
      allowed: draftResult.allowed,
      reason: draftResult.reason,
      clauseText: draftResult.clauseText,
      conflictsWithBaseTerms: draftResult.conflictsWithBaseTerms,
      disclaimer: DISCLAIMER,
    };
  }
}
