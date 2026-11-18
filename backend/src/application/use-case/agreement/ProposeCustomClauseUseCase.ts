import mongoose from "mongoose";
import type { IProposeCustomClauseUseCase } from "@application/interfaces/use-case/agreement/IProposeCustomClauseUseCase";
import type { ProposeCustomClauseDto } from "@application/dto/agreement/ProposeCustomClauseDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementEntity, CustomClauseEntity } from "@domain/entities/AgreementEntity";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class ProposeCustomClauseUseCase implements IProposeCustomClauseUseCase {
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
        dto: ProposeCustomClauseDto
    ): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(agreementId);
        if (!agreement) {
            throw new NotFoundError("Agreement not found.");
        }

        if (agreement.hostId !== userId && agreement.seekerId !== userId) {
            throw new UnauthorizedError("You are not authorized to propose clauses for this agreement.");
        }

        if (agreement.status === "signed" || agreement.lockedAt) {
            throw new ValidationError("Signed agreements cannot be modified.");
        }

        if (agreement.status === "cancelled") {
            throw new ValidationError("Cannot modify a cancelled agreement.");
        }

        const originalText = (dto.originalText || "").trim();
        const finalText = (dto.finalText || "").trim();

        if (!finalText) {
            throw new ValidationError("Clause text cannot be empty.");
        }

        if (originalText.length > 500) {
            throw new ValidationError("Clause need description must not exceed 500 characters.");
        }

        if (finalText.length > 1000) {
            throw new ValidationError("Final clause text must not exceed 1000 characters.");
        }

        if ((agreement.customClauses || []).length >= 25) {
            throw new ValidationError("Maximum limit of 25 custom clauses reached for this agreement.");
        }

        const newClause: CustomClauseEntity = {
            id: new mongoose.Types.ObjectId().toString(),
            proposedBy: userId,
            originalText: originalText || finalText,
            aiDraftText: dto.aiDraftText?.trim() || undefined,
            finalText,
            status: "proposed",
            createdAt: new Date().toISOString(),
        };

        const updatedClauses = [...(agreement.customClauses || []), newClause];

        const updated = await this.agreementRepository.update(agreement.id, {
            status: agreement.status === "draft" ? "negotiating" : agreement.status,
            customClauses: updatedClauses,
        });

        if (!updated) {
            throw new NotFoundError("Failed to update agreement with custom clause.");
        }

        const enriched = await this.enrich(updated);

        // Notify counterparty and room
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
