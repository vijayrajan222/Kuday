import type { INotificationRepository } from "../../application/interfaces/repository/INotificationRepository.js";
import type { NotificationEntity } from "../../domain/entities/NotificationEntity.js";
import { NotificationModel } from "../database/model/NotificationModel.js";

interface NotificationDoc {
    _id: { toString(): string } | string;
    userId: string;
    title: string;
    message: string;
    type: "admin_verification" | "interest_request" | "system";
    isRead: boolean;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
}

export class MongoNotificationRepository implements INotificationRepository {
    private mapToEntity(doc: NotificationDoc): NotificationEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            userId: doc.userId,
            title: doc.title,
            message: doc.message,
            type: doc.type,
            isRead: doc.isRead,
            createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
            updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
        };
    }

    async create(data: Omit<NotificationEntity, "id">): Promise<NotificationEntity> {
        const doc = await NotificationModel.create({
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type,
            isRead: data.isRead ?? false,
        });
        return this.mapToEntity(doc);
    }

    async findByUserId(userId: string): Promise<NotificationEntity[]> {
        const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async markAsRead(id: string): Promise<NotificationEntity | null> {
        const doc = await NotificationModel.findByIdAndUpdate(
            id,
            { $set: { isRead: true } },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async markAllAsRead(userId: string): Promise<void> {
        await NotificationModel.updateMany({ userId }, { $set: { isRead: true } }).exec();
    }
}
