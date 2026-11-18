import type { ICheckAgreementUnlockUseCase } from "@application/interfaces/use-case/agreement/ICheckAgreementUnlockUseCase";
import type { AgreementUnlockStatusResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IVisitRepository } from "@application/interfaces/repository/IVisitRepository";
import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";

export class CheckAgreementUnlockUseCase implements ICheckAgreementUnlockUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly visitRepository: IVisitRepository,
        private readonly conversationRepository: IConversationRepository,
        private readonly messageRepository: IMessageRepository
    ) {}

    async execute(hostId: string, seekerId: string, roomId: string): Promise<AgreementUnlockStatusResponseDto> {
        // 1. If an active agreement already exists, it is permanently unlocked
        const activeAgreement = await this.agreementRepository.findActive(hostId, seekerId, roomId);
        if (activeAgreement) {
            return {
                unlocked: true,
                visitCompleted: true,
                callCompleted: true,
                activeAgreementId: activeAgreement.id,
            };
        }

        // 2. Check if a visit between these users is marked as completed
        let visitCompleted = false;
        try {
            const hostVisits = await this.visitRepository.findByUserId(hostId);
            visitCompleted = hostVisits.some(
                (v) =>
                    ((v.hostId === hostId && v.seekerId === seekerId) ||
                        (v.hostId === seekerId && v.seekerId === hostId)) &&
                    v.status === "completed"
            );
        } catch {
            visitCompleted = false;
        }

        // 3. Check if a video call between these users has been completed
        let callCompleted = false;
        try {
            const conversation = await this.conversationRepository.findByParticipants(hostId, seekerId);
            if (conversation) {
                const messages = await this.messageRepository.findByConversationId(conversation.id, 100);
                callCompleted = messages.some(
                    (m) => m.type === "call" && m.callType === "video" && m.outcome === "completed"
                );
            }
        } catch {
            callCompleted = false;
        }

        const unlocked = visitCompleted || callCompleted;

        return {
            unlocked,
            visitCompleted,
            callCompleted,
            reason: unlocked
                ? undefined
                : "Agreement creation is locked. A completed in-person visit or video call between host and seeker is required.",
        };
    }
}
