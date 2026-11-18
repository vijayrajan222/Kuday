import type { IUpdateCommonTermsUseCase } from "@application/interfaces/use-case/agreement/IUpdateCommonTermsUseCase";
import type {
    ProposeCommonTermsDto,
    RespondCommonTermsDto,
} from "@application/dto/agreement/UpdateCommonTermsDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class UpdateCommonTermsUseCase implements IUpdateCommonTermsUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository,
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

    async propose(dto: ProposeCommonTermsDto): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(dto.agreementId);
        if (!agreement) {
            throw new NotFoundError("Agreement not found.");
        }

        if (agreement.hostId !== dto.userId && agreement.seekerId !== dto.userId) {
            throw new UnauthorizedError("You are not authorized to edit this agreement.");
        }

        if (agreement.status === "signed" || agreement.lockedAt) {
            throw new ValidationError("Signed agreements cannot be edited.");
        }

        const updated = await this.agreementRepository.update(agreement.id, {
            status: agreement.status === "draft" ? "negotiating" : agreement.status,
            pendingCommonTerms: {
                proposedBy: dto.userId,
                terms: dto.terms,
                status: "pending",
                proposedAt: new Date().toISOString(),
            },
        });

        if (!updated) {
            throw new NotFoundError("Failed to update agreement terms.");
        }

        // Notify other party via socket
        const otherUserId = dto.userId === agreement.hostId ? agreement.seekerId : agreement.hostId;
        if (this.socketService) {
            this.socketService.notifyUser(otherUserId, "agreement_updated", {
                agreementId: agreement.id,
                action: "common_terms_proposed",
                proposedBy: dto.userId,
            });
        }

        return this.enrich(updated);
    }

    async respond(dto: RespondCommonTermsDto): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(dto.agreementId);
        if (!agreement) {
            throw new NotFoundError("Agreement not found.");
        }

        if (agreement.hostId !== dto.userId && agreement.seekerId !== dto.userId) {
            throw new UnauthorizedError("You are not authorized to respond to this agreement.");
        }

        if (agreement.status === "signed" || agreement.lockedAt) {
            throw new ValidationError("Signed agreements cannot be modified.");
        }

        const pending = agreement.pendingCommonTerms;
        if (!pending || pending.status !== "pending") {
            throw new ValidationError("No pending common terms proposal to respond to.");
        }

        if (pending.proposedBy === dto.userId) {
            throw new ValidationError("You cannot respond to your own terms proposal. Wait for the other party.");
        }

        const now = new Date().toISOString();
        let updatePayload: Partial<AgreementEntity> = {};

        if (dto.action === "accept") {
            updatePayload = {
                commonTerms: pending.terms,
                pendingCommonTerms: {
                    ...pending,
                    status: "accepted",
                    respondedAt: now,
                },
            };
        } else {
            updatePayload = {
                pendingCommonTerms: {
                    ...pending,
                    status: "rejected",
                    respondedAt: now,
                },
            };
        }

        const updated = await this.agreementRepository.update(agreement.id, updatePayload);
        if (!updated) {
            throw new NotFoundError("Failed to update agreement terms response.");
        }

        // Notify the proponent
        if (this.socketService) {
            this.socketService.notifyUser(pending.proposedBy, "agreement_updated", {
                agreementId: agreement.id,
                action: `common_terms_${dto.action}ed`,
                respondedBy: dto.userId,
            });
        }

        return this.enrich(updated);
    }
}
