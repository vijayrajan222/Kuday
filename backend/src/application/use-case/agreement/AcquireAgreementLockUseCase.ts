import type { IAcquireAgreementLockUseCase } from "@application/interfaces/use-case/agreement/IAcquireAgreementLockUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import { NotFoundError, UnauthorizedError, ConflictError, ValidationError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";

export class AcquireAgreementLockUseCase implements IAcquireAgreementLockUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository,
        private readonly socketService?: ISocketNotificationService
    ) {}

    async execute(agreementId: string, userId: string): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(agreementId);
        if (!agreement) {
            throw new NotFoundError("Agreement not found.");
        }

        if (agreement.hostId !== userId && agreement.seekerId !== userId) {
            throw new UnauthorizedError("You are not authorized to edit this agreement.");
        }

        if (agreement.status === "completed") {
            throw new ValidationError("This agreement is finalized and locked. Edits are no longer permitted.");
        }

        if (agreement.status === "cancelled") {
            throw new ValidationError("This agreement has been cancelled.");
        }

        // Check if an active lock is already held by the other party
        if (agreement.editLock?.userId && agreement.editLock.userId !== userId) {
            const expiresAt = new Date(agreement.editLock.expiresAt || 0).getTime();
            if (expiresAt > Date.now()) {
                const lockHolder = await this.userRepository.findById(agreement.editLock.userId);
                const holderName = lockHolder
                    ? `${lockHolder.firstName} ${lockHolder.lastName || ""}`.trim()
                    : "The other party";
                throw new ConflictError(`${holderName} is currently editing this agreement. Please wait for their review.`);
            }
        }

        // 10 minutes lock expiry window
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const updated = await this.agreementRepository.update(agreementId, {
            editLock: {
                userId,
                expiresAt,
            },
        });

        if (!updated) {
            throw new NotFoundError("Failed to acquire lock for agreement.");
        }

        if (this.socketService) {
            const payload = {
                agreementId,
                editLock: updated.editLock,
                revision: updated.revision,
            };
            this.socketService.emitToAgreement?.(agreementId, "agreement_lock_updated", payload);
            this.socketService.notifyUser(updated.hostId, "agreement_lock_updated", payload);
            this.socketService.notifyUser(updated.seekerId, "agreement_lock_updated", payload);
        }

        return enrichAgreement(updated, this.userRepository, this.roomRepository);
    }
}
