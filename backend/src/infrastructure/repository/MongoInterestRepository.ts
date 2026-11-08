import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { InterestEntity, InterestStatus } from "@domain/entities/InterestEntity";
import { InterestModel, type InterestDoc } from "@infrastructure/database/model/InterestModel";

export class MongoInterestRepository implements IInterestRepository {
    private mapToEntity(doc: InterestDoc): InterestEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            senderId: doc.senderId,
            receiverId: doc.receiverId,
            targetType: doc.targetType as "room" | "seeker",
            targetId: doc.targetId,
            status: doc.status as InterestStatus,
            message: doc.message,
            createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
            updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
        };
    }

    async create(data: Omit<InterestEntity, "id">): Promise<InterestEntity> {
        const doc = await InterestModel.create({
            senderId: data.senderId,
            receiverId: data.receiverId,
            targetType: data.targetType,
            targetId: data.targetId,
            status: data.status ?? "pending",
            message: data.message ?? "",
        });
        return this.mapToEntity(doc);
    }

    async findById(id: string): Promise<InterestEntity | null> {
        const doc = await InterestModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findBySenderReceiverTarget(
        senderId: string,
        receiverId: string,
        targetId: string
    ): Promise<InterestEntity | null> {
        const doc = await InterestModel.findOne({
            senderId,
            receiverId,
            targetId,
        }).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByReceiverId(receiverId: string): Promise<InterestEntity[]> {
        const docs = await InterestModel.find({ receiverId })
            .sort({ createdAt: -1 })
            .exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findBySenderId(senderId: string): Promise<InterestEntity[]> {
        const docs = await InterestModel.find({ senderId })
            .sort({ createdAt: -1 })
            .exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findBetweenUsers(userA: string, userB: string): Promise<InterestEntity[]> {
        const docs = await InterestModel.find({
            $or: [
                { senderId: userA, receiverId: userB },
                { senderId: userB, receiverId: userA },
            ],
        }).exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async updateStatus(id: string, status: InterestStatus): Promise<InterestEntity | null> {
        const doc = await InterestModel.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async updateStatusBetweenUsers(
        userA: string,
        userB: string,
        status: InterestStatus
    ): Promise<void> {
        await InterestModel.updateMany(
            {
                $or: [
                    { senderId: userA, receiverId: userB },
                    { senderId: userB, receiverId: userA },
                ],
            },
            { $set: { status } }
        ).exec();
    }
}
