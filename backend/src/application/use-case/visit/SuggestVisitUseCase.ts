import type { IVisitRepository } from "@application/interfaces/repository/IVisitRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { ISuggestVisitUseCase } from "@application/interfaces/use-case/visit/ISuggestVisitUseCase";
import type { SuggestVisitDto } from "@application/dto/visit/SuggestVisitDto";
import type { VisitEntity } from "@domain/entities/VisitEntity";
import { NotFoundError, UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class SuggestVisitUseCase implements ISuggestVisitUseCase {
    constructor(
        private readonly visitRepo: IVisitRepository,
        private readonly userRepo: IUserRepository,
        private readonly notificationRepo: INotificationRepository,
        private readonly sendMessageUseCase?: ISendMessageUseCase,
        private readonly socketService?: ISocketNotificationService
    ) {}

    async execute(dto: SuggestVisitDto): Promise<VisitEntity> {
        if (!dto.suggestedDate) {
            throw new ValidationError("Suggested date is required.");
        }
        if (!dto.suggestedTimeSlot) {
            throw new ValidationError("Suggested time slot is required.");
        }

        const visit = await this.visitRepo.findById(dto.visitId);
        if (!visit) {
            throw new NotFoundError("Visit not found.");
        }

        if (visit.seekerId !== dto.userId && visit.hostId !== dto.userId) {
            throw new UnauthorizedError("You are not authorized to suggest changes for this visit.");
        }

        const suggestedBy = dto.userId === visit.hostId ? "host" : "seeker";
        const recipientId = dto.userId === visit.hostId ? visit.seekerId : visit.hostId;

        const updated = await this.visitRepo.updateSuggestion(dto.visitId, {
            suggestedBy,
            suggestedDate: dto.suggestedDate,
            suggestedTimeSlot: dto.suggestedTimeSlot,
            suggestedSlotTime: dto.suggestedSlotTime || "02:00 PM",
            suggestedMessage: dto.suggestedMessage || "",
            status: "rescheduled",
        });

        if (!updated) {
            throw new NotFoundError("Failed to update visit suggestion.");
        }

        const actor = await this.userRepo.findById(dto.userId);
        const actorName = actor ? `${actor.firstName} ${actor.lastName || ""}`.trim() : "Host";

        // Notification
        try {
            const notif = await this.notificationRepo.create({
                userId: recipientId,
                title: "Visit Reschedule Suggested 🔄",
                message: `${actorName} proposed a new visit time: ${dto.suggestedDate} (${dto.suggestedSlotTime}).`,
                type: "visit_request",
                isRead: false,
            });

            if (this.socketService) {
                this.socketService.notifyUser(recipientId, "new_notification", notif);
            }
        } catch (err) {
            console.error("Failed to send reschedule notification:", err);
        }

        // Chat message
        if (this.sendMessageUseCase) {
            try {
                const chatContent = `🔄 Reschedule Suggested: ${actorName} suggested ${dto.suggestedDate} during ${dto.suggestedTimeSlot} (${dto.suggestedSlotTime}).${dto.suggestedMessage ? `\n\nNote: "${dto.suggestedMessage}"` : ""}`;
                await this.sendMessageUseCase.execute({
                    senderId: dto.userId,
                    receiverId: recipientId,
                    content: chatContent,
                });
            } catch (err) {
                console.error("Failed to send reschedule chat message:", err);
            }
        }

        if (this.socketService) {
            this.socketService.notifyUser(recipientId, "visit_update", updated);
            this.socketService.notifyUser(dto.userId, "visit_update", updated);
        }

        return updated;
    }
}
