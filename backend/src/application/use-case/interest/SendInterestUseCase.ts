import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { ISendInterestUseCase } from "@application/interfaces/use-case/interest/ISendInterestUseCase";
import type { SendInterestDto } from "@application/dto/interest/SendInterestDto";
import type { InterestDetailDto } from "@application/dto/interest/InterestDetailDto";
import { ConflictError, ValidationError } from "@application/errors/AppError";

export class SendInterestUseCase implements ISendInterestUseCase {
    constructor(
        private readonly interestRepo: IInterestRepository,
        private readonly userRepo: IUserRepository,
        private readonly notificationRepo: INotificationRepository
    ) {}

    async execute(dto: SendInterestDto): Promise<InterestDetailDto> {
        if (dto.senderId === dto.receiverId) {
            throw new ValidationError("You cannot send an interest request to yourself.");
        }

        // 1. Check if both users are ALREADY connected
        const mutualInterests = await this.interestRepo.findBetweenUsers(
            dto.senderId,
            dto.receiverId
        );

        const isAlreadyConnected = mutualInterests.some((i) => i.status === "accepted");
        if (isAlreadyConnected) {
            throw new ConflictError("You are already connected with this user.");
        }

        // 2. Check if the other user already sent a pending request to this user
        const reversePending = mutualInterests.find(
            (i) => i.senderId === dto.receiverId && i.receiverId === dto.senderId && i.status === "pending"
        );

        if (reversePending) {
            // Implicit mutual acceptance: both users want to connect!
            const updated = await this.interestRepo.updateStatus(reversePending.id, "accepted");
            await this.interestRepo.updateStatusBetweenUsers(dto.senderId, dto.receiverId, "accepted");

            const sender = await this.userRepo.findById(dto.senderId);
            const receiver = await this.userRepo.findById(dto.receiverId);
            const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : "A user";

            await this.notificationRepo.create({
                userId: dto.receiverId,
                title: "Interest Request Accepted! 🎉",
                message: `${senderName} also showed interest in you! You are now connected.`,
                type: "interest_request",
                isRead: false,
            });

            return {
                id: updated ? updated.id : reversePending.id,
                senderId: dto.senderId,
                receiverId: dto.receiverId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                status: "accepted",
                message: dto.message ?? "",
                createdAt: updated?.createdAt,
                updatedAt: updated?.updatedAt,
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

        // 3. Check if this exact request was already sent by this sender
        const existing = await this.interestRepo.findBySenderReceiverTarget(
            dto.senderId,
            dto.receiverId,
            dto.targetId
        );

        let savedInterest;

        if (existing) {
            if (existing.status === "pending") {
                throw new ConflictError("You have already sent an interest request. It is pending.");
            }
            if (existing.status === "accepted") {
                throw new ConflictError("You are already connected with this user.");
            }
            // If previously declined, allow re-requesting by updating back to pending
            savedInterest = await this.interestRepo.updateStatus(existing.id, "pending");
        } else {
            savedInterest = await this.interestRepo.create({
                senderId: dto.senderId,
                receiverId: dto.receiverId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                status: "pending",
                message: dto.message ?? "",
            });
        }

        if (!savedInterest) {
            throw new ValidationError("Failed to create interest request.");
        }

        // Fetch sender details to attach to notification
        const sender = await this.userRepo.findById(dto.senderId);
        const receiver = await this.userRepo.findById(dto.receiverId);
        const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : "A user";

        // Dispatch real-time notification to the receiver
        await this.notificationRepo.create({
            userId: dto.receiverId,
            title: "New Interest Request 💌",
            message: `${senderName} expressed interest in your ${dto.targetType === "room" ? "room listing" : "profile"}!`,
            type: "interest_request",
            isRead: false,
        });

        return {
            id: savedInterest.id,
            senderId: savedInterest.senderId,
            receiverId: savedInterest.receiverId,
            targetType: savedInterest.targetType,
            targetId: savedInterest.targetId,
            status: savedInterest.status,
            message: savedInterest.message,
            createdAt: savedInterest.createdAt,
            updatedAt: savedInterest.updatedAt,
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
