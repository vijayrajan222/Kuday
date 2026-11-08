import type { IVisitRepository } from "@application/interfaces/repository/IVisitRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { ISendMessageUseCase } from "@application/interfaces/use-case/chat/ISendMessageUseCase";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { ICreateVisitUseCase } from "@application/interfaces/use-case/visit/ICreateVisitUseCase";
import type { CreateVisitDto } from "@application/dto/visit/CreateVisitDto";
import type { VisitEntity } from "@domain/entities/VisitEntity";
import { NotFoundError, ValidationError, ConflictError } from "@application/errors/AppError";

export class CreateVisitUseCase implements ICreateVisitUseCase {
    constructor(
        private readonly visitRepo: IVisitRepository,
        private readonly userRepo: IUserRepository,
        private readonly notificationRepo: INotificationRepository,
        private readonly sendMessageUseCase?: ISendMessageUseCase,
        private readonly socketService?: ISocketNotificationService
    ) {}

    async execute(dto: CreateVisitDto): Promise<VisitEntity> {
        if (!dto.date) {
            throw new ValidationError("Visit date is required.");
        }
        if (!dto.timeSlot) {
            throw new ValidationError("Time slot is required.");
        }

        // Check if an active visit schedule already exists for this connection
        const existingVisits = await this.visitRepo.findByConnectionId(dto.connectionId);
        const activeExisting = existingVisits.find((v) =>
            ["pending", "rescheduled", "confirmed"].includes(v.status)
        );
        if (activeExisting) {
            throw new ConflictError(
                "An active visit schedule already exists for this connection. Please manage the existing visit request."
            );
        }

        const seeker = await this.userRepo.findById(dto.seekerId);
        if (!seeker) {
            throw new NotFoundError("Seeker user not found.");
        }

        const host = await this.userRepo.findById(dto.hostId);
        if (!host) {
            throw new NotFoundError("Host user not found.");
        }

        const seekerName = `${seeker.firstName} ${seeker.lastName || ""}`.trim();

        // Create visit record
        const visit = await this.visitRepo.create({
            connectionId: dto.connectionId,
            seekerId: dto.seekerId,
            hostId: dto.hostId,
            roomId: dto.roomId || "",
            date: dto.date,
            timeSlot: dto.timeSlot,
            slotTime: dto.slotTime || "02:00 PM",
            message: dto.message || "",
            status: "pending",
            suggestedBy: "seeker",
        });

        // Create notification for host
        try {
            const notif = await this.notificationRepo.create({
                userId: dto.hostId,
                title: "New Visit Request 📅",
                message: `${seekerName} requested to schedule a visit on ${dto.date} (${dto.slotTime}).`,
                type: "visit_request",
                isRead: false,
            });

            if (this.socketService) {
                this.socketService.notifyUser(dto.hostId, "new_notification", notif);
            }
        } catch (err) {
            console.error("Failed to create visit notification:", err);
        }

        // Send automated message in chat thread
        if (this.sendMessageUseCase) {
            try {
                const chatContent = `📅 Schedule Visit Request: Proposed visit on ${dto.date} during ${dto.timeSlot} (${dto.slotTime}).${dto.message ? `\n\n"${dto.message}"` : ""}`;
                await this.sendMessageUseCase.execute({
                    senderId: dto.seekerId,
                    receiverId: dto.hostId,
                    content: chatContent,
                });
            } catch (err) {
                console.error("Failed to send visit chat message:", err);
            }
        }

        // Notify over socket
        if (this.socketService) {
            this.socketService.notifyUser(dto.hostId, "visit_update", visit);
            this.socketService.notifyUser(dto.seekerId, "visit_update", visit);
        }

        return visit;
    }
}
