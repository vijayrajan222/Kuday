import type { IGetUnreadCountUseCase } from "@application/interfaces/use-case/chat/IGetUnreadCountUseCase";
import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";

export class GetUnreadCountUseCase implements IGetUnreadCountUseCase {
    constructor(private messageRepository: IMessageRepository) {}

    async execute(userId: string): Promise<number> {
        if (!userId) {
            throw new Error("User ID is required");
        }
        return await this.messageRepository.countUnread(userId);
    }
}
