import type { ITerminateAgreementUseCase, TerminateAgreementDto } from "@application/interfaces/use-case/agreement/ITerminateAgreementUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";

export class TerminateAgreementUseCase implements ITerminateAgreementUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository,
        private readonly socketService?: ISocketNotificationService
    ) {}

    async execute(
        agreementId: string,
        userId: string,
        dto: TerminateAgreementDto
    ): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(agreementId);
        if (!agreement) {
            throw new NotFoundError("Agreement not found.");
        }

        if (agreement.hostId !== userId && agreement.seekerId !== userId) {
            throw new UnauthorizedError("You are not authorized to update this agreement.");
        }

        const targetStatus = dto.status;
        if (targetStatus !== "ended" && targetStatus !== "cancelled") {
            throw new ValidationError("Target status must be 'ended' or 'cancelled'.");
        }

        // Idempotency: if already in the target status, return enriched agreement
        if (agreement.status === targetStatus) {
            return enrichAgreement(agreement, this.userRepository, this.roomRepository);
        }

        // Case 1: Active/Completed agreement being ended or cancelled
        if (agreement.status === "completed") {
            // Atomic termination with slotRestored guard ensures this runs ONLY ONCE
            const updated = await this.agreementRepository.markTerminatedAtomic(agreementId, targetStatus);

            if (updated) {
                // 1. Add 1 back to availableSlots (never above capacity via atomic $expr)
                const updatedRoom = await this.roomRepository.incrementAvailableSlots(agreement.roomId);

                // 2. Set seeker's role to "none"
                await this.userRepository.updateProfile(agreement.seekerId, { role: "none" });

                const enriched = await enrichAgreement(updated, this.userRepository, this.roomRepository);

                if (this.socketService) {
                    this.socketService.emitToAgreement?.(agreementId, "agreement_updated", enriched);
                    this.socketService.notifyUser(updated.hostId, "agreement_updated", enriched);
                    this.socketService.notifyUser(updated.seekerId, "agreement_updated", enriched);

                    if (updatedRoom && updatedRoom.hostId) {
                        this.socketService.notifyUser(updatedRoom.hostId, "room_updated", {
                            id: updatedRoom.id,
                            availableSlots: updatedRoom.availableSlots,
                            isActive: updatedRoom.isActive,
                        });
                    }
                }

                return enriched;
            }

            // If atomic update returned null, another concurrent call terminated it
            const fresh = await this.agreementRepository.findById(agreementId);
            return enrichAgreement(fresh || agreement, this.userRepository, this.roomRepository);
        }

        // Case 2: Inactive/Draft/Negotiating/Awaiting-payment agreement cancelled
        const updated = await this.agreementRepository.update(agreementId, {
            status: "cancelled",
            editLock: { userId: null, expiresAt: null },
            pendingWith: null,
        });

        if (!updated) {
            throw new NotFoundError("Failed to cancel agreement.");
        }

        const enriched = await enrichAgreement(updated, this.userRepository, this.roomRepository);

        if (this.socketService) {
            this.socketService.emitToAgreement?.(agreementId, "agreement_updated", enriched);
            this.socketService.notifyUser(updated.hostId, "agreement_updated", enriched);
            this.socketService.notifyUser(updated.seekerId, "agreement_updated", enriched);
        }

        return enriched;
    }
}
