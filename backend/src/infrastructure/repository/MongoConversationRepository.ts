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
        const sorted = [participant1, participant2].sort();

        // Check if a conversation with both participants already exists
        const existingDocs = await ConversationModel.find({
            participants: { $all: [participant1, participant2], $size: 2 },
        })
            .sort({ updatedAt: -1, createdAt: -1 })
            .exec();

        if (existingDocs.length > 0) {
            // Keep the one that contains messages or is the most recently updated
            const primary = existingDocs.find((d) => Boolean(d.lastMessage?.content)) || existingDocs[0];

            // Clean up any empty ghost duplicates in the background
            if (existingDocs.length > 1) {
                const duplicateIds = existingDocs
                    .filter((d) => d._id.toString() !== primary._id.toString())
                    .map((d) => d._id);
                ConversationModel.deleteMany({ _id: { $in: duplicateIds } }).exec().catch(() => {});
            }

            return this.mapToEntity(primary);
        }

        // Atomically upsert with deterministic sorted participants array to prevent race conditions
        const doc = await ConversationModel.findOneAndUpdate(
            { participants: sorted },
            {
                $setOnInsert: {
                    participants: sorted,
                    lastMessage: { content: "", senderId: "", createdAt: "" },
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).exec();

        return this.mapToEntity(doc!);
    }

    async findById(id: string): Promise<ConversationEntity | null> {
        const doc = await ConversationModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByUserId(userId: string): Promise<ConversationEntity[]> {
        const docs = await ConversationModel.find({
            participants: userId,
        })
            .sort({ updatedAt: -1, createdAt: -1 })
            .exec();

        // Deduplicate in memory by other participant so there is never more than 1 conversation per person
        const seenOtherParticipants = new Set<string>();
        const uniqueDocs: ConversationDoc[] = [];

        for (const doc of docs) {
            const other = doc.participants.find((p) => p !== userId) || doc.participants[0] || doc._id.toString();
            if (!seenOtherParticipants.has(other)) {
                seenOtherParticipants.add(other);
                uniqueDocs.push(doc);
            } else {
                // If it's a duplicate and empty, clean it up
                if (!doc.lastMessage?.content) {
                    ConversationModel.findByIdAndDelete(doc._id).exec().catch(() => {});
                }
            }
        }

        return uniqueDocs.map((doc) => this.mapToEntity(doc));
    }

    async findByParticipants(participant1: string, participant2: string): Promise<ConversationEntity | null> {
        const docs = await ConversationModel.find({
            participants: { $all: [participant1, participant2], $size: 2 },
        })
            .sort({ updatedAt: -1, createdAt: -1 })
            .exec();

        if (docs.length === 0) return null;
        const primary = docs.find((d) => Boolean(d.lastMessage?.content)) || docs[0];
        return this.mapToEntity(primary);
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
