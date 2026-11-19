import type { IReleaseAgreementLockUseCase } from "@application/interfaces/use-case/agreement/IReleaseAgreementLockUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import { NotFoundError, UnauthorizedError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";

export class ReleaseAgreementLockUseCase implements IReleaseAgreementLockUseCase {
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
            throw new UnauthorizedError("You are not authorized to update this agreement.");
        }

        // Only release if held by this user or already expired
        const isHolder = agreement.editLock?.userId === userId;
        const isExpired = agreement.editLock?.expiresAt
            ? new Date(agreement.editLock.expiresAt).getTime() <= Date.now()
            : true;

        if (isHolder || isExpired) {
            const updated = await this.agreementRepository.update(agreementId, {
                editLock: {
                    userId: null,
                    expiresAt: null,
                },
            });

            if (updated) {
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

        return enrichAgreement(agreement, this.userRepository, this.roomRepository);
    }
}
