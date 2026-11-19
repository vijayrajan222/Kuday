import type {
    ISubmitAgreementProposalUseCase,
    SubmitAgreementProposalDto,
} from "@application/interfaces/use-case/agreement/ISubmitAgreementProposalUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import { NotFoundError, UnauthorizedError, ConflictError, ValidationError } from "@application/errors/AppError";
import { enrichAgreement } from "./helpers/enrichAgreement";

export class SubmitAgreementProposalUseCase implements ISubmitAgreementProposalUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository,
        private readonly notificationRepository?: INotificationRepository,
        private readonly sendMessageUseCase?: ISendMessageUseCase,
        private readonly socketService?: ISocketNotificationService
    ) {}

    async execute(
        agreementId: string,
        userId: string,
        dto: SubmitAgreementProposalDto
    ): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(agreementId);
        if (!agreement) {
            throw new NotFoundError("Agreement not found.");
        }

        if (agreement.hostId !== userId && agreement.seekerId !== userId) {
            throw new UnauthorizedError("You are not authorized to update this agreement.");
        }

        if (agreement.status === "completed") {
            throw new ValidationError("Agreement is finalized and locked. Further proposals are not permitted.");
        }

        // Lock ownership check
        if (!agreement.editLock?.userId || agreement.editLock.userId !== userId) {
            throw new ConflictError("You do not hold the active editing lock for this agreement.");
        }

        const lockExpiresAt = new Date(agreement.editLock.expiresAt || 0).getTime();
        if (lockExpiresAt <= Date.now()) {
            throw new ConflictError("Your editing lock has expired. Please re-acquire the lock before submitting.");
        }

        // Optimistic concurrency check
        if (agreement.revision !== dto.revision) {
            throw new ConflictError(
                "The agreement was updated by the other party while you were editing. Please refresh to inspect the latest revision."
            );
        }

        const recipientId = userId === agreement.hostId ? agreement.seekerId : agreement.hostId;
        const nextRevision = agreement.revision + 1;

        // Custom clauses formatting
        const updatedClauses = (dto.customClauses || agreement.customClauses).map((clause) => ({
            ...clause,
            status: "accepted" as const, // in a submitted proposal, the author's clauses are proposed as part of the unified document
        }));

        const updated = await this.agreementRepository.update(agreementId, {
            commonTerms: dto.commonTerms || agreement.commonTerms,
            customClauses: updatedClauses,
            revision: nextRevision,
            status: "negotiating",
            lastSubmittedBy: userId,
            pendingWith: recipientId,
            acceptedBy: [userId],
            editLock: {
                userId: null,
                expiresAt: null,
            },
        });

        if (!updated) {
            throw new NotFoundError("Failed to submit agreement proposal.");
        }

        const enriched = await enrichAgreement(updated, this.userRepository, this.roomRepository);

        // Real-time socket sync
        if (this.socketService) {
            this.socketService.emitToAgreement?.(agreementId, "agreement_updated", enriched);
            this.socketService.notifyUser(updated.hostId, "agreement_updated", enriched);
            this.socketService.notifyUser(updated.seekerId, "agreement_updated", enriched);
        }

        // Notifications & chat
        const sender = await this.userRepository.findById(userId);
        const senderName = sender ? `${sender.firstName} ${sender.lastName || ""}`.trim() : "Roommate";

        try {
            if (this.notificationRepository) {
                const notif = await this.notificationRepository.create({
                    userId: recipientId,
                    title: "Rental Agreement Proposal",
                    message: `${senderName} submitted a revised rental agreement proposal for your review.`,
                    type: "system",
                    isRead: false,
                });
                this.socketService?.notifyUser(recipientId, "new_notification", notif);
            }

            if (this.sendMessageUseCase) {
                await this.sendMessageUseCase.execute({
                    senderId: userId,
                    receiverId: recipientId,
                    content: `Agreement Update: I have submitted a new proposal (Rev #${nextRevision}) for our rental agreement. Please review and accept or propose changes.`,
                });
            }
        } catch (err) {
            console.error("Failed to deliver proposal notification/chat:", err);
        }

        return enriched;
    }
}
