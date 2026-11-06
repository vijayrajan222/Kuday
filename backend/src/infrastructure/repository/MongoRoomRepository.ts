import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository.js";
import type { RoomEntity } from "@domain/entities/RoomEntity.js";
import { RoomModel, type RoomDoc } from "@infrastructure/database/model/RoomModel.js";

export class MongoRoomRepository implements IRoomRepository {
    private mapToEntity(doc: RoomDoc): RoomEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            hostId: doc.hostId,
            title: doc.title ?? undefined,
            roomType: doc.roomType,
            monthlyRent: doc.monthlyRent,
            location: doc.location,
            capacity: doc.capacity,
            availabilityNotes: doc.availabilityNotes,
            amenities: doc.amenities ?? [],
            images: doc.images ?? [],
            description: doc.description ?? undefined,
            isActive: doc.isActive ?? true,
            createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
            updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
        };
    }

    async create(roomData: Omit<RoomEntity, "id">): Promise<RoomEntity> {
        const payload = {
            hostId: roomData.hostId,
            roomType: roomData.roomType,
            monthlyRent: roomData.monthlyRent,
            location: roomData.location,
            capacity: roomData.capacity,
            availabilityNotes: roomData.availabilityNotes,
            amenities: roomData.amenities,
            images: roomData.images,
            title: roomData.title || "",
            description: roomData.description || "",
            isActive: roomData.isActive ?? true,
        };
        const doc = await RoomModel.create(payload);
        return this.mapToEntity(doc);
    }

    async update(id: string, roomData: Partial<RoomEntity>): Promise<RoomEntity | null> {
        const doc = await RoomModel.findByIdAndUpdate(
            id,
            { $set: roomData },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async updateStatusByHostId(hostId: string, isActive: boolean): Promise<void> {
        await RoomModel.updateMany({ hostId }, { $set: { isActive } }).exec();
    }

    async findByHostId(hostId: string): Promise<RoomEntity[]> {
        const docs = await RoomModel.find({ hostId }).exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findAll(): Promise<RoomEntity[]> {
        const docs = await RoomModel.find().exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findById(id: string): Promise<RoomEntity | null> {
        const doc = await RoomModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
}
