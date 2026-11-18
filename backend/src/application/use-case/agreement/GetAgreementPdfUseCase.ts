import type { IGetAgreementPdfUseCase } from "@application/interfaces/use-case/agreement/IGetAgreementPdfUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IPdfGeneratorService } from "@application/interfaces/services/IPdfGeneratorService";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import { NotFoundError, UnauthorizedError } from "@application/errors/AppError";

export class GetAgreementPdfUseCase implements IGetAgreementPdfUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly pdfGeneratorService: IPdfGeneratorService
  ) {}

  private async enrich(agreement: AgreementEntity): Promise<AgreementResponseDto> {
    const [host, seeker, room] = await Promise.all([
      this.userRepository.findById(agreement.hostId),
      this.userRepository.findById(agreement.seekerId),
      this.roomRepository.findById(agreement.roomId),
    ]);

    return {
      ...agreement,
      host: host
        ? {
            id: host.id,
            firstName: host.firstName,
            lastName: host.lastName,
            email: host.email,
            role: host.role || "host",
            selfieUrl: host.selfieUrl,
            isPremium: host.isPremium,
          }
        : undefined,
      seeker: seeker
        ? {
            id: seeker.id,
            firstName: seeker.firstName,
            lastName: seeker.lastName,
            email: seeker.email,
            role: seeker.role || "seeker",
            selfieUrl: seeker.selfieUrl,
            isPremium: seeker.isPremium,
          }
        : undefined,
      room: room
        ? {
            id: room.id,
            title: room.title,
            roomType: room.roomType,
            monthlyRent: room.monthlyRent,
            location: room.location,
            images: room.images || [],
          }
        : undefined,
    };
  }

  async execute(userId: string, agreementId: string): Promise<{ buffer: Buffer; fileName: string }> {
    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundError("Agreement not found.");
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new UnauthorizedError("You are not authorized to download this agreement PDF.");
    }

    const enriched = await this.enrich(agreement);
    const buffer = await this.pdfGeneratorService.generateAgreementPdf(enriched);
    const fileName = `Kuday_Agreement_${agreement.id.slice(-6).toUpperCase()}.pdf`;

    return { buffer, fileName };
  }
}
