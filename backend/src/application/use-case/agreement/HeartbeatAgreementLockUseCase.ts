import type { IHeartbeatAgreementLockUseCase } from "@application/interfaces/use-case/agreement/IHeartbeatAgreementLockUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import { NotFoundError, UnauthorizedError, ConflictError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";

export class HeartbeatAgreementLockUseCase implements IHeartbeatAgreementLockUseCase {
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

        // Must hold the active lock
        if (!agreement.editLock?.userId || agreement.editLock.userId !== userId) {
            throw new ConflictError("You do not hold the active editing lock for this agreement.");
        }

        // Extend lock by 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const updated = await this.agreementRepository.update(agreementId, {
            editLock: {
                userId,
                expiresAt,
            },
        });

        if (!updated) {
            throw new NotFoundError("Failed to renew agreement lock.");
        }

        if (this.socketService) {
            const payload = {
                agreementId,
                editLock: updated.editLock,
                revision: updated.revision,
            };
            this.socketService.emitToAgreement?.(agreementId, "agreement_lock_updated", payload);
        }

        return enrichAgreement(updated, this.userRepository, this.roomRepository);
    }
}
