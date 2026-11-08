import type { IVisitRepository } from "@application/interfaces/repository/IVisitRepository";
import type { VisitEntity, VisitStatus } from "@domain/entities/VisitEntity";
import { VisitModel, type VisitDoc } from "@infrastructure/database/model/VisitModel";

export class MongoVisitRepository implements IVisitRepository {
    private mapToEntity(doc: VisitDoc): VisitEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            connectionId: doc.connectionId,
            seekerId: doc.seekerId,
            hostId: doc.hostId,
            roomId: doc.roomId || undefined,
            date: doc.date,
            timeSlot: doc.timeSlot as "morning" | "afternoon" | "evening",
            slotTime: doc.slotTime,
            message: doc.message,
            status: doc.status as VisitStatus,
            suggestedBy: (doc.suggestedBy as "seeker" | "host") || undefined,
            suggestedDate: doc.suggestedDate || undefined,
            suggestedTimeSlot: (doc.suggestedTimeSlot as "morning" | "afternoon" | "evening") || undefined,
            suggestedSlotTime: doc.suggestedSlotTime || undefined,
            suggestedMessage: doc.suggestedMessage || undefined,
            createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
            updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
        };
    }

    async create(data: Omit<VisitEntity, "id" | "createdAt" | "updatedAt">): Promise<VisitEntity> {
        const doc = await VisitModel.create({
            connectionId: data.connectionId,
            seekerId: data.seekerId,
            hostId: data.hostId,
            roomId: data.roomId ?? "",
            date: data.date,
            timeSlot: data.timeSlot,
            slotTime: data.slotTime ?? "02:00 PM",
            message: data.message ?? "",
            status: data.status ?? "pending",
            suggestedBy: data.suggestedBy ?? "seeker",
            suggestedDate: data.suggestedDate ?? "",
            suggestedTimeSlot: data.suggestedTimeSlot ?? "",
            suggestedSlotTime: data.suggestedSlotTime ?? "",
            suggestedMessage: data.suggestedMessage ?? "",
        });
        return this.mapToEntity(doc);
    }

    async findById(id: string): Promise<VisitEntity | null> {
        const doc = await VisitModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByConnectionId(connectionId: string): Promise<VisitEntity[]> {
        const docs = await VisitModel.find({ connectionId })
            .sort({ createdAt: -1 })
            .exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findByUserId(userId: string): Promise<VisitEntity[]> {
        const docs = await VisitModel.find({
            $or: [{ seekerId: userId }, { hostId: userId }],
        })
            .sort({ createdAt: -1 })
            .exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async updateStatus(id: string, status: VisitStatus): Promise<VisitEntity | null> {
        const doc = await VisitModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async updateSuggestion(
        id: string,
        data: {
            suggestedBy: "seeker" | "host";
            suggestedDate: string;
            suggestedTimeSlot: "morning" | "afternoon" | "evening";
            suggestedSlotTime: string;
            suggestedMessage?: string;
            status: "rescheduled";
        }
    ): Promise<VisitEntity | null> {
        const doc = await VisitModel.findByIdAndUpdate(
            id,
            {
                suggestedBy: data.suggestedBy,
                suggestedDate: data.suggestedDate,
                suggestedTimeSlot: data.suggestedTimeSlot,
                suggestedSlotTime: data.suggestedSlotTime,
                suggestedMessage: data.suggestedMessage ?? "",
                status: data.status,
            },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async applySuggestion(id: string): Promise<VisitEntity | null> {
        const current = await VisitModel.findById(id).exec();
        if (!current || !current.suggestedDate || !current.suggestedTimeSlot) {
            return null;
        }

        const doc = await VisitModel.findByIdAndUpdate(
            id,
            {
                date: current.suggestedDate,
                timeSlot: current.suggestedTimeSlot,
                slotTime: current.suggestedSlotTime || current.slotTime,
                status: "confirmed",
                suggestedDate: "",
                suggestedTimeSlot: "",
                suggestedSlotTime: "",
                suggestedMessage: "",
            },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
}
