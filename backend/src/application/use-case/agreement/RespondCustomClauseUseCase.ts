import type { IRespondCustomClauseUseCase } from "@application/interfaces/use-case/agreement/IRespondCustomClauseUseCase";
import type { RespondCustomClauseDto } from "@application/dto/agreement/RespondCustomClauseDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementEntity, CustomClauseEntity } from "@domain/entities/AgreementEntity";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class RespondCustomClauseUseCase implements IRespondCustomClauseUseCase {
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

    async execute(
        userId: string,
        agreementId: string,
        clauseId: string,
        dto: RespondCustomClauseDto
    ): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(agreementId);
        if (!agreement) {
            throw new NotFoundError("Agreement not found.");
        }

        if (agreement.hostId !== userId && agreement.seekerId !== userId) {
            throw new UnauthorizedError("You are not authorized to respond to clauses for this agreement.");
        }

        if (agreement.status === "signed" || agreement.lockedAt) {
            throw new ValidationError("Signed agreements cannot be modified.");
        }

        if (agreement.status === "cancelled") {
            throw new ValidationError("Cannot modify a cancelled agreement.");
        }

        const clauses = [...(agreement.customClauses || [])];
        const clauseIndex = clauses.findIndex((c) => c.id === clauseId);
        const targetClause = clauses[clauseIndex];
        if (clauseIndex === -1 || !targetClause) {
            throw new NotFoundError("Custom clause not found.");
        }

        if (targetClause.status !== "proposed" && targetClause.status !== "countered") {
            throw new ValidationError(`This clause has already been ${targetClause.status}.`);
        }

        // Only the counterparty can respond to a proposed or countered clause
        if (targetClause.proposedBy === userId) {
            throw new ValidationError("You cannot respond to your own proposed clause. Awaiting counterparty action.");
        }

        const now = new Date().toISOString();
        let updatedClause: CustomClauseEntity;

        if (dto.action === "accept") {
            updatedClause = {
                id: targetClause.id,
                proposedBy: targetClause.proposedBy,
                originalText: targetClause.originalText,
                aiDraftText: targetClause.aiDraftText,
                finalText: targetClause.finalText,
                createdAt: targetClause.createdAt,
                status: "accepted",
                respondedBy: userId,
                respondedAt: now,
            };
        } else if (dto.action === "reject") {
            updatedClause = {
                id: targetClause.id,
                proposedBy: targetClause.proposedBy,
                originalText: targetClause.originalText,
                aiDraftText: targetClause.aiDraftText,
                finalText: targetClause.finalText,
                createdAt: targetClause.createdAt,
                status: "rejected",
                respondedBy: userId,
                respondedAt: now,
            };
        } else if (dto.action === "counter") {
            const counterText = (dto.counterText || "").trim();
            if (!counterText) {
                throw new ValidationError("Counter-proposed clause text is required.");
            }
            if (counterText.length > 1000) {
                throw new ValidationError("Counter-proposed clause must not exceed 1000 characters.");
            }

            updatedClause = {
                id: targetClause.id,
                originalText: targetClause.originalText,
                aiDraftText: targetClause.aiDraftText,
                createdAt: targetClause.createdAt,
                finalText: counterText,
                status: "countered",
                proposedBy: userId,
                respondedBy: undefined,
                respondedAt: now,
            };
        } else {
            throw new ValidationError("Invalid action. Must be accept, reject, or counter.");
        }

        clauses[clauseIndex] = updatedClause;

        const updated = await this.agreementRepository.update(agreement.id, {
            status: agreement.status === "draft" ? "negotiating" : agreement.status,
            customClauses: clauses,
        });

        if (!updated) {
            throw new NotFoundError("Failed to update custom clause.");
        }

        const enriched = await this.enrich(updated);

        // Notify room and counterparty
        if (this.socketService) {
            if (this.socketService.emitToAgreement) {
                this.socketService.emitToAgreement(agreement.id, "agreement_updated", enriched);
            }
            const otherUserId = agreement.hostId === userId ? agreement.seekerId : agreement.hostId;
            this.socketService.notifyUser(otherUserId, "agreement_updated", enriched);
        }

        return enriched;
    }
}
