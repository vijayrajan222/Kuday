import type { ISignAgreementUseCase } from "@application/interfaces/use-case/agreement/ISignAgreementUseCase";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementEntity, PartySignature } from "@domain/entities/AgreementEntity";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class SignAgreementUseCase implements ISignAgreementUseCase {
  constructor(
    private readonly agreementRepository: IAgreementRepository,
    private readonly userRepository: IUserRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly notificationRepository?: INotificationRepository,
    private readonly socketService?: ISocketNotificationService
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

  async execute(userId: string, agreementId: string, clientIp: string): Promise<AgreementResponseDto> {
    const agreement = await this.agreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundError("Agreement not found.");
    }

    if (agreement.hostId !== userId && agreement.seekerId !== userId) {
      throw new UnauthorizedError("You are not authorized to sign this agreement.");
    }

    if (agreement.status === "signed" || agreement.lockedAt) {
      throw new ValidationError("Agreement has already been fully signed and sealed.");
    }

    if (agreement.status === "cancelled") {
      throw new ValidationError("Cannot sign a cancelled agreement.");
    }

    // Check payment completion
    const isPaymentRequired = agreement.payment?.required;
    const isPaidOrWaived =
      agreement.payment?.status === "completed" || agreement.payment?.status === "waived";

    if (isPaymentRequired && !isPaidOrWaived) {
      throw new ValidationError("The agreement verification fee must be completed before signing.");
    }

    // Check unresolved custom clauses
    const unresolvedClauses = (agreement.customClauses || []).filter(
      (c) => c.status === "proposed" || c.status === "countered"
    );
    if (unresolvedClauses.length > 0) {
      throw new ValidationError("All custom clauses must be accepted or rejected before signing.");
    }

    // Check pending common terms
    if (agreement.pendingCommonTerms?.status === "pending") {
      throw new ValidationError("Pending common terms proposals must be resolved before signing.");
    }

    const now = new Date().toISOString();
    const isHost = userId === agreement.hostId;
    const currentHostSig: PartySignature | undefined = agreement.signatures?.host;
    const currentSeekerSig: PartySignature | undefined = agreement.signatures?.seeker;

    if (isHost && currentHostSig?.signedAt) {
      throw new ValidationError("You have already electronically signed this agreement.");
    }

    if (!isHost && currentSeekerSig?.signedAt) {
      throw new ValidationError("You have already electronically signed this agreement.");
    }

    const newHostSig: PartySignature | undefined = isHost
      ? { signedAt: now, ip: clientIp }
      : currentHostSig;

    const newSeekerSig: PartySignature | undefined = !isHost
      ? { signedAt: now, ip: clientIp }
      : currentSeekerSig;

    const bothPartiesSigned = Boolean(newHostSig?.signedAt && newSeekerSig?.signedAt);

    const updatePayload: Partial<AgreementEntity> = {
      signatures: {
        host: newHostSig,
        seeker: newSeekerSig,
      },
    };

    if (bothPartiesSigned) {
      updatePayload.status = "signed";
      updatePayload.lockedAt = now;
      updatePayload.pdfUrl = `/agreements/${agreement.id}/pdf`;
    } else {
      updatePayload.status = "ready_to_sign";
    }

    const updated = await this.agreementRepository.update(agreement.id, updatePayload);
    if (!updated) {
      throw new NotFoundError("Failed to update agreement signature.");
    }

    const enriched = await this.enrich(updated);

    // Socket broadcasts
    if (this.socketService) {
      if (this.socketService.emitToAgreement) {
        this.socketService.emitToAgreement(agreement.id, "agreement_updated", enriched);
      }
      this.socketService.notifyUser(agreement.hostId, "agreement_updated", enriched);
      this.socketService.notifyUser(agreement.seekerId, "agreement_updated", enriched);

      if (bothPartiesSigned) {
        if (this.socketService.emitToAgreement) {
          this.socketService.emitToAgreement(agreement.id, "agreement_signed", enriched);
        }
        this.socketService.notifyUser(agreement.hostId, "agreement_signed", enriched);
        this.socketService.notifyUser(agreement.seekerId, "agreement_signed", enriched);
      }
    }

    // In-app notifications
    if (bothPartiesSigned && this.notificationRepository) {
      await Promise.all([
        this.notificationRepository.create({
          userId: agreement.hostId,
          title: "Rental Agreement Fully Signed & Sealed",
          message: "Both you and your tenant have executed the rental agreement. Your locked PDF copy is now available.",
          type: "system",
          isRead: false,
        }),
        this.notificationRepository.create({
          userId: agreement.seekerId,
          title: "Rental Agreement Fully Signed & Sealed",
          message: "Both you and your host have executed the rental agreement. Your locked PDF copy is now available.",
          type: "system",
          isRead: false,
        }),
      ]);
    }

    return enriched;
  }
}
