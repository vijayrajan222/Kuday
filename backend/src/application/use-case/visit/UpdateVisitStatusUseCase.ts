import type { IVisitRepository } from "@application/interfaces/repository/IVisitRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { IUpdateVisitStatusUseCase } from "@application/interfaces/use-case/visit/IUpdateVisitStatusUseCase";
import type { UpdateVisitStatusDto } from "@application/dto/visit/UpdateVisitStatusDto";
import type { VisitEntity } from "@domain/entities/VisitEntity";
import { NotFoundError, UnauthorizedError } from "@application/errors/AppError";

export class UpdateVisitStatusUseCase implements IUpdateVisitStatusUseCase {
    constructor(
        private readonly visitRepo: IVisitRepository,
        private readonly userRepo: IUserRepository,
        private readonly notificationRepo: INotificationRepository,
        private readonly sendMessageUseCase?: ISendMessageUseCase,
        private readonly socketService?: ISocketNotificationService
    ) {}

    async execute(dto: UpdateVisitStatusDto): Promise<VisitEntity> {
        const visit = await this.visitRepo.findById(dto.visitId);
        if (!visit) {
            throw new NotFoundError("Visit not found.");
        }

        if (visit.seekerId !== dto.userId && visit.hostId !== dto.userId) {
            throw new UnauthorizedError("You are not authorized to update this visit.");
        }

        const requesterId = visit.createdBy || visit.seekerId;
        if (dto.status === "confirmed" && visit.status === "pending" && dto.userId === requesterId) {
            throw new ValidationError("You cannot accept your own visit request. The other party must confirm the visit.");
        }

        const updated = await this.visitRepo.updateStatus(dto.visitId, dto.status);
        if (!updated) {
            throw new NotFoundError("Failed to update visit status.");
        }

        const recipientId = dto.userId === visit.seekerId ? visit.hostId : visit.seekerId;
        const actor = await this.userRepo.findById(dto.userId);
        const actorName = actor ? `${actor.firstName} ${actor.lastName || ""}`.trim() : "Roommate";

        const statusText =
            dto.status === "confirmed"
                ? "confirmed"
                : dto.status === "cancelled"
                ? "cancelled"
                : dto.status === "rejected"
                ? "declined"
                : dto.status;

        // Notification
        try {
            const notif = await this.notificationRepo.create({
                userId: recipientId,
                title:
                    dto.status === "confirmed"
                        ? "Visit Confirmed! ✅"
                        : dto.status === "rejected"
                        ? "Visit Declined ❌"
                        : dto.status === "cancelled"
                        ? "Visit Cancelled ❌"
                        : "Visit Status Updated 📅",
                message: `${actorName} has ${statusText} the scheduled visit for ${visit.date} (${visit.slotTime}).${dto.note ? ` Note: "${dto.note}"` : ""}`,
                type: "visit_request",
                isRead: false,
            });

            if (this.socketService) {
                this.socketService.notifyUser(recipientId, "new_notification", notif);
            }
        } catch (err) {
            console.error("Failed to notify user of visit status update:", err);
        }

        // Chat message
        if (this.sendMessageUseCase) {
            try {
                let chatMessage = "";
                if (dto.status === "confirmed") {
                    chatMessage = `✅ Visit Confirmed: Visit on ${visit.date} at ${visit.slotTime} (${visit.timeSlot}) is confirmed!`;
                } else if (dto.status === "cancelled") {
                    chatMessage = `❌ Visit Cancelled: The scheduled visit for ${visit.date} was cancelled.${dto.note ? ` Reason: "${dto.note}"` : ""}`;
                } else if (dto.status === "rejected") {
                    chatMessage = `❌ Visit Declined: The scheduled visit for ${visit.date} was declined.${dto.note ? ` Reason: "${dto.note}"` : ""}`;
                }
                if (chatMessage) {
                    await this.sendMessageUseCase.execute({
                        senderId: dto.userId,
                        receiverId: recipientId,
                        content: chatMessage,
                    });
                }
            } catch (err) {
                console.error("Failed to send status update chat message:", err);
            }
        }

        if (this.socketService) {
            this.socketService.notifyUser(recipientId, "visit_update", updated);
            this.socketService.notifyUser(dto.userId, "visit_update", updated);
        }

        return updated;
    }

    async acceptSuggestion(visitId: string, userId: string): Promise<VisitEntity> {
        const visit = await this.visitRepo.findById(visitId);
        if (!visit) {
            throw new NotFoundError("Visit not found.");
        }

        if (visit.seekerId !== userId && visit.hostId !== userId) {
            throw new UnauthorizedError("You are not authorized to accept this suggestion.");
        }

        const suggesterId =
            visit.suggestedById ||
            (visit.suggestedBy === "host" ? visit.hostId : visit.seekerId);
        if (userId === suggesterId) {
            throw new ValidationError("You cannot accept your own proposed reschedule time.");
        }

        const updated = await this.visitRepo.applySuggestion(visitId);
        if (!updated) {
            throw new NotFoundError("Failed to apply suggestion.");
        }

        const recipientId = userId === visit.seekerId ? visit.hostId : visit.seekerId;
        const actor = await this.userRepo.findById(userId);
        const actorName = actor ? `${actor.firstName} ${actor.lastName || ""}`.trim() : "Roommate";

        try {
            const notif = await this.notificationRepo.create({
                userId: recipientId,
                title: "Visit Reschedule Accepted! 🎉",
                message: `${actorName} accepted your suggested visit time: ${updated.date} (${updated.slotTime}).`,
                type: "visit_request",
                isRead: false,
            });

            if (this.socketService) {
                this.socketService.notifyUser(recipientId, "new_notification", notif);
            }
        } catch (err) {
            console.error("Failed to send reschedule accept notification:", err);
        }

        if (this.sendMessageUseCase) {
            try {
                await this.sendMessageUseCase.execute({
                    senderId: userId,
                    receiverId: recipientId,
                    content: `🎉 Reschedule Accepted: Visit confirmed for ${updated.date} at ${updated.slotTime} (${updated.timeSlot}).`,
                });
            } catch (err) {
                console.error("Failed to send reschedule accept chat message:", err);
            }
        }

        if (this.socketService) {
            this.socketService.notifyUser(recipientId, "visit_update", updated);
            this.socketService.notifyUser(userId, "visit_update", updated);
        }

        return updated;
    }
}
