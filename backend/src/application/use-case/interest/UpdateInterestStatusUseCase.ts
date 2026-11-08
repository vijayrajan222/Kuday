import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { IUpdateInterestStatusUseCase } from "@application/interfaces/use-case/interest/IUpdateInterestStatusUseCase";
import type { UpdateInterestStatusDto } from "@application/dto/interest/UpdateInterestStatusDto";
import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";
import { NotFoundError, ForbiddenError, ValidationError } from "@application/errors/AppError";

export class UpdateInterestStatusUseCase implements IUpdateInterestStatusUseCase {
    constructor(
        private readonly interestRepo: IInterestRepository,
        private readonly userRepo: IUserRepository,
        private readonly notificationRepo: INotificationRepository
    ) {}

    async execute(dto: UpdateInterestStatusDto): Promise<InterestDetailDto> {
        if (dto.status !== "accepted" && dto.status !== "declined") {
            throw new ValidationError("Invalid status. Allowed values: 'accepted' or 'declined'.");
        }

        const interest = await this.interestRepo.findById(dto.interestId);
        if (!interest) {
            throw new NotFoundError("Interest request not found.");
        }

        if (interest.receiverId !== dto.userId) {
            throw new ForbiddenError("You are not authorized to respond to this interest request.");
        }

        const updated = await this.interestRepo.updateStatus(interest.id, dto.status);
        if (!updated) {
            throw new ValidationError("Failed to update interest request status.");
        }

        const receiver = await this.userRepo.findById(interest.receiverId);
        const sender = await this.userRepo.findById(interest.senderId);
        const receiverName = receiver
            ? `${receiver.firstName} ${receiver.lastName}`.trim()
            : "The recipient";

        if (dto.status === "accepted") {
            // Also mark any other reciprocal requests between these two users as accepted
            await this.interestRepo.updateStatusBetweenUsers(
                interest.senderId,
                interest.receiverId,
                "accepted"
            );

            // Notify the original sender that their interest was accepted
            await this.notificationRepo.create({
                userId: interest.senderId,
                title: "Interest Request Accepted! 🎉",
                message: `${receiverName} accepted your interest request! You are now connected.`,
                type: "interest_request",
                isRead: false,
            });
        }

        return {
            id: updated.id,
            senderId: updated.senderId,
            receiverId: updated.receiverId,
            targetType: updated.targetType,
            targetId: updated.targetId,
            status: updated.status,
            message: updated.message,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            sender: sender
                ? {
                      id: sender.id,
                      firstName: sender.firstName,
                      lastName: sender.lastName,
                      email: sender.email,
                      selfieUrl: sender.selfieUrl,
                      role: sender.role,
                  }
                : undefined,
            receiver: receiver
                ? {
                      id: receiver.id,
                      firstName: receiver.firstName,
                      lastName: receiver.lastName,
                      email: receiver.email,
                      selfieUrl: receiver.selfieUrl,
                      role: receiver.role,
                  }
                : undefined,
        };
    }
}
