import type { IAcceptAgreementProposalUseCase } from "@application/interfaces/use-case/agreement/IAcceptAgreementProposalUseCase";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { AgreementEntity, AgreementPaymentStatus } from "@domain/entities/AgreementEntity";
import { NotFoundError, UnauthorizedError, ConflictError, ValidationError } from "@application/errors/AppError";
import { getAgreementFee } from "@domain/services/agreementFeeCalculator";
import { enrichAgreement } from "./helpers/enrichAgreement";
import { activateAgreement } from "./helpers/occupancyHelper";

export class AcceptAgreementProposalUseCase implements IAcceptAgreementProposalUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository,
        private readonly notificationRepository?: INotificationRepository,
        private readonly sendMessageUseCase?: ISendMessageUseCase,
        private readonly socketService?: ISocketNotificationService,
        private readonly interestRepository?: IInterestRepository
    ) {}

    async execute(agreementId: string, userId: string, revision: number): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(agreementId);
        if (!agreement) {
            throw new NotFoundError("Agreement not found.");
        }

        if (agreement.hostId !== userId && agreement.seekerId !== userId) {
            throw new UnauthorizedError("You are not authorized to accept this agreement.");
        }

        if (agreement.status === "completed") {
            throw new ValidationError("Agreement is already finalized and signed.");
        }

        // Optimistic concurrency check
        if (agreement.revision !== revision) {
            throw new ConflictError("Agreement proposal revision has changed. Please refresh and review the latest terms before accepting.");
        }

        // Finalization rule: can only be accepted by the party who did NOT make the latest submission
        if (agreement.lastSubmittedBy && agreement.lastSubmittedBy === userId) {
            throw new ValidationError("You cannot accept your own proposal. Waiting for the other party to review and respond.");
        }

        const [hostUser, seekerUser] = await Promise.all([
            this.userRepository.findById(agreement.hostId),
            this.userRepository.findById(agreement.seekerId),
        ]);

        if (!hostUser || !seekerUser) {
            throw new NotFoundError("Parties to the agreement could not be resolved.");
        }

        // Acceptance tracking
        const nowIso = new Date().toISOString();
        const acceptanceTimestamps = {
            host: agreement.acceptanceTimestamps?.host || (userId === agreement.hostId ? nowIso : (agreement.lastSubmittedBy === agreement.hostId ? nowIso : null)),
            seeker: agreement.acceptanceTimestamps?.seeker || (userId === agreement.seekerId ? nowIso : (agreement.lastSubmittedBy === agreement.seekerId ? nowIso : null)),
        };

        const acceptedBy = Array.from(new Set([...agreement.acceptedBy, userId]));

        // Calculate fee
        const feeCalc = getAgreementFee(hostUser, seekerUser);

        let nextStatus: "awaiting_payment" | "completed" = "completed";
        let paymentData: {
            required: boolean;
            payerId: string;
            amount: number;
            status: AgreementPaymentStatus;
        } = {
            required: false,
            payerId: seekerUser.id,
            amount: 0,
            status: "waived",
        };
        let lockedAt: string | undefined = nowIso;

        if (feeCalc.required && feeCalc.amount > 0 && agreement.payment?.status !== "completed") {
            nextStatus = "awaiting_payment";
            paymentData = {
                required: true,
                payerId: seekerUser.id,
                amount: feeCalc.amount,
                status: "pending",
            };
            lockedAt = undefined;
        }

        let updated: AgreementEntity | null = null;

        if (nextStatus === "completed") {
            const activationResult = await activateAgreement(
                {
                    agreementRepository: this.agreementRepository,
                    roomRepository: this.roomRepository,
                    userRepository: this.userRepository,
                    interestRepository: this.interestRepository,
                    socketService: this.socketService,
                },
                agreementId,
                {
                    acceptedBy,
                    acceptanceTimestamps,
                    payment: {
                        ...agreement.payment,
                        ...paymentData,
                    },
                    pendingWith: null,
                    editLock: {
                        userId: null,
                        expiresAt: null,
                    },
                }
            );
            if (!activationResult.slotReserved) {
                throw new ValidationError("No available slots remaining for this room.");
            }
            updated = activationResult.agreement;
        } else {
            updated = await this.agreementRepository.update(agreementId, {
                status: nextStatus,
                acceptedBy,
                acceptanceTimestamps,
                payment: {
                    ...agreement.payment,
                    ...paymentData,
                },
                lockedAt,
                pendingWith: null,
                editLock: {
                    userId: null,
                    expiresAt: null,
                },
            });
        }

        if (!updated) {
            throw new NotFoundError("Failed to accept agreement proposal.");
        }

        const enriched = await enrichAgreement(updated, this.userRepository, this.roomRepository);

        // Socket sync
        if (this.socketService) {
            this.socketService.emitToAgreement?.(agreementId, "agreement_updated", enriched);
            this.socketService.notifyUser(updated.hostId, "agreement_updated", enriched);
            this.socketService.notifyUser(updated.seekerId, "agreement_updated", enriched);
            if (nextStatus === "completed") {
                this.socketService.emitToAgreement?.(agreementId, "agreement_finalized", enriched);
            }
        }

        // Notify other user
        const otherUserId = userId === agreement.hostId ? agreement.seekerId : agreement.hostId;
        const acceptingUser = userId === agreement.hostId ? hostUser : seekerUser;
        const acceptingName = `${acceptingUser.firstName} ${acceptingUser.lastName || ""}`.trim();

        try {
            if (this.notificationRepository) {
                const notif = await this.notificationRepository.create({
                    userId: otherUserId,
                    title: "Agreement Accepted",
                    message: `${acceptingName} accepted the rental agreement proposal. ${
                        nextStatus === "awaiting_payment"
                            ? "Awaiting agreement fee payment to complete."
                            : "The agreement is now finalized and ready for download!"
                    }`,
                    type: "system",
                    isRead: false,
                });
                this.socketService?.notifyUser(otherUserId, "new_notification", notif);
            }

            if (this.sendMessageUseCase) {
                await this.sendMessageUseCase.execute({
                    senderId: userId,
                    receiverId: otherUserId,
                    content: `Agreement Accepted: I have accepted the rental agreement proposal. ${
                        nextStatus === "awaiting_payment"
                            ? "Awaiting fee payment before sealing."
                            : "The agreement is now finalized and ready for PDF download!"
                    }`,
                });
            }
        } catch (err) {
            console.error("Failed to deliver accept notification/chat:", err);
        }

        return enriched;
    }
}
