import type { IGetAgreementPdfUseCase } from "@application/interfaces/use-case/agreement/IGetAgreementPdfUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IPdfGeneratorService } from "@application/interfaces/services/IPdfGeneratorService";
import type {
  GetAgreementPdfInputDto,
  GetAgreementPdfOutputDto,
} from "@application/dto/agreement/AgreementPdfDto";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";

export class GetAgreementPdfUseCase implements IGetAgreementPdfUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly pdfGeneratorService: IPdfGeneratorService
  ) {}

  async execute(
    inputOrUserId: GetAgreementPdfInputDto | string,
    rawAgreementId?: string
  ): Promise<GetAgreementPdfOutputDto> {
    const userId = typeof inputOrUserId === "object" ? inputOrUserId.userId : inputOrUserId;
    const agreementId = typeof inputOrUserId === "object" ? inputOrUserId.agreementId : rawAgreementId!;

    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundError("Agreement not found.");
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new UnauthorizedError("You are not authorized to download this agreement PDF.");
    }

    if (agreement.status !== "completed") {
      throw new ValidationError("PDF is only available after the agreement is fully completed and signed.");
    }

    const enriched = await enrichAgreement(agreement, this.userRepository, this.roomRepository);
    const buffer = await this.pdfGeneratorService.generateAgreementPdf(enriched);

    const safeRoom = (enriched.room?.title || "room").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const fileName = `agreement-${safeRoom}-${agreementId.slice(-6)}.pdf`;

    return { buffer, fileName };
  }
}
