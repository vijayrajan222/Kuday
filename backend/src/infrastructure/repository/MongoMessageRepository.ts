import type { IMessageRepository } from "@application/interfaces/repository/IMessageRepository";
import type { MessageEntity } from "@domain/entities/MessageEntity";
import { MessageModel, type MessageDoc } from "@infrastructure/database/model/MessageModel";

export class MongoMessageRepository implements IMessageRepository {
    private mapToEntity(doc: MessageDoc): MessageEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            conversationId: doc.conversationId,
            senderId: doc.senderId,
            receiverId: doc.receiverId,
            content: doc.content,
            isRead: Boolean(doc.isRead),
            createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
        };
    }

    async create(data: Omit<MessageEntity, "id" | "createdAt" | "updatedAt">): Promise<MessageEntity> {
        const doc = await MessageModel.create({
            conversationId: data.conversationId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            isRead: data.isRead ?? false,
        });
        return this.mapToEntity(doc);
    }

    async findByConversationId(
        conversationId: string,
        limit = 50,
        before?: string
    ): Promise<MessageEntity[]> {
        const filter: Record<string, unknown> = { conversationId };
        if (before) {
            filter.createdAt = { $lt: new Date(before) };
        }

        const docs = await MessageModel.find(filter)
            .sort({ createdAt: 1 })
            .limit(limit)
            .exec();

        return docs.map((doc) => this.mapToEntity(doc));
    }

    async markAsRead(conversationId: string, receiverId: string): Promise<void> {
        await MessageModel.updateMany(
            { conversationId, receiverId, isRead: false },
            { $set: { isRead: true } }
        ).exec();
    }

    async countUnread(userId: string): Promise<number> {
        return MessageModel.countDocuments({ receiverId: userId, isRead: false }).exec();
    }

    async countUnreadByConversation(conversationId: string, userId: string): Promise<number> {
        return MessageModel.countDocuments({
            conversationId,
            receiverId: userId,
            isRead: false,
        }).exec();
    }
}
