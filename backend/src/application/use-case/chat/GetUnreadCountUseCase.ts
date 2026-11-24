import type { IGetUnreadCountUseCase } from "@application/interfaces/use-case/chat/IGetUnreadCountUseCase";
import type { GetUnreadCountDto } from "@application/dto/chat/ChatDto";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";

export class GetUnreadCountUseCase implements IGetUnreadCountUseCase {
    constructor(private messageRepository: IMessageRepository) {}

    async execute(dtoOrUserId: GetUnreadCountDto | string): Promise<number> {
        const userId = typeof dtoOrUserId === "object" ? dtoOrUserId.userId : dtoOrUserId;
        if (!userId) {
            throw new Error("User ID is required");
        }
        return await this.messageRepository.countUnread(userId);
    }
}
