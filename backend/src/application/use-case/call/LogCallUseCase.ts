import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";
import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { MessageEntity, CallType, CallOutcome } from "@domain/entities/MessageEntity";
import type {
    ILogCallUseCase,
    LogCallInput,
} from "@application/interfaces/use-case/call/ILogCallUseCase";

export type { LogCallInput };

export class LogCallUseCase implements ILogCallUseCase {
    constructor(
        private messageRepository: IMessageRepository,
        private conversationRepository: IConversationRepository
    ) {}

    async execute(input: LogCallInput): Promise<MessageEntity> {
        const { callerId, receiverId, callType, outcome, startedAt, answeredAt, endedAt } = input;

        // Calculate duration: endedAt minus answeredAt in seconds, 0 unless completed
        let durationSec = 0;
        if (outcome === "completed" && answeredAt) {
            durationSec = Math.max(0, Math.round((endedAt.getTime() - answeredAt.getTime()) / 1000));
        }

        let conversationId = input.conversationId;
        if (!conversationId) {
            const conv = await this.conversationRepository.findOrCreate(callerId, receiverId);
            conversationId = conv.id;
        }

        // Summary text for content
        let content = `${callType === "video" ? "Video" : "Audio"} call`;
        if (outcome === "missed") {
            content = `Missed ${callType} call`;
        } else if (outcome === "declined") {
            content = `Declined ${callType} call`;
        } else if (outcome === "completed") {
            const minutes = Math.floor(durationSec / 60);
            const seconds = durationSec % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            content = `${callType === "video" ? "Video" : "Audio"} call · ${timeStr}`;
        }

        const message = await this.messageRepository.create({
            conversationId,
            senderId: callerId,
            receiverId,
            content,
            type: "call",
            callType,
            outcome,
            startedAt,
            endedAt,
            durationSec,
            isRead: false,
        });

        const now = endedAt.toISOString();
        await this.conversationRepository.updateLastMessage(conversationId, {
            content,
            senderId: callerId,
            createdAt: now,
        });

        return message;
    }
}
