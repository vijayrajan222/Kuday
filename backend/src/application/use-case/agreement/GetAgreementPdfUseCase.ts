import type { IGetAgreementPdfUseCase } from "@application/interfaces/use-case/agreement/IGetAgreementPdfUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IPdfGeneratorService } from "@application/interfaces/services/IPdfGeneratorService";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";

export class GetAgreementPdfUseCase implements IGetAgreementPdfUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly pdfGeneratorService: IPdfGeneratorService
  ) {}

  async execute(userId: string, agreementId: string): Promise<{ buffer: Buffer; fileName: string }> {
    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundError("Agreement not found.");
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new UnauthorizedError("You are not authorized to download this agreement PDF.");
    }

    if (agreement.status !== "completed") {
      throw new ValidationError("Agreement must be finalized and accepted by both parties before downloading the PDF.");
    }

    if (agreement.payment?.required && agreement.payment?.status !== "completed" && agreement.payment?.status !== "waived") {
      throw new ValidationError("Agreement fee must be paid before downloading the PDF.");
    }

    const enriched = await enrichAgreement(agreement, this.userRepository, this.roomRepository);
    const buffer = await this.pdfGeneratorService.generateAgreementPdf(enriched);
    const fileName = `Kuday_Agreement_Rev${agreement.revision || 1}_${agreement.id.slice(-6).toUpperCase()}.pdf`;

    return { buffer, fileName };
  }
}
