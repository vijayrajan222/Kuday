import type { IConversationRepository } from "@application/interfaces/repository/IConversationRepository";
import type { ConversationEntity } from "@domain/entities/ConversationEntity";
import { ConversationModel, type ConversationDoc } from "@infrastructure/database/model/ConversationModel";

export class MongoConversationRepository implements IConversationRepository {
    private mapToEntity(doc: ConversationDoc): ConversationEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            participants: doc.participants,
            lastMessage: doc.lastMessage?.content
                ? {
                      content: doc.lastMessage.content,
                      senderId: doc.lastMessage.senderId,
                      createdAt: doc.lastMessage.createdAt || "",
                  }
                : undefined,
            createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
        };
    }

    async findOrCreate(participant1: string, participant2: string): Promise<ConversationEntity> {
        // Look for conversation where participants array contains both users
        let doc = await ConversationModel.findOne({
            participants: { $all: [participant1, participant2], $size: 2 },
        }).exec();

        if (!doc) {
            doc = await ConversationModel.create({
                participants: [participant1, participant2],
            });
        }

        return this.mapToEntity(doc);
    }

    async findById(id: string): Promise<ConversationEntity | null> {
        const doc = await ConversationModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByUserId(userId: string): Promise<ConversationEntity[]> {
        const docs = await ConversationModel.find({
            participants: userId,
        })
            .sort({ updatedAt: -1 })
            .exec();

        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findByParticipants(participant1: string, participant2: string): Promise<ConversationEntity | null> {
        const doc = await ConversationModel.findOne({
            participants: { $all: [participant1, participant2], $size: 2 },
        }).exec();

        return doc ? this.mapToEntity(doc) : null;
    }

    async updateLastMessage(
        conversationId: string,
        lastMessage: { content: string; senderId: string; createdAt: string }
    ): Promise<void> {
        await ConversationModel.findByIdAndUpdate(conversationId, {
            $set: { lastMessage },
        }).exec();
    }
}
