import type { ISeekerPreferenceRepository } from "@application/interfaces/repository/ISeekerPreferenceRepository";
import type { SeekerPreferenceEntity } from "@domain/entities/SeekerPreferenceEntity";
import { SeekerPreferenceModel, type SeekerPreferenceDoc } from "@infrastructure/database/model/SeekerPreferenceModel";

export class MongoSeekerPreferenceRepository implements ISeekerPreferenceRepository {
    private mapToEntity(doc: SeekerPreferenceDoc): SeekerPreferenceEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            userId: doc.userId,
            preferredLocation: doc.preferredLocation,
            maxBudget: doc.maxBudget,
            roomTypePreference: doc.roomTypePreference,
            requiredAmenities: doc.requiredAmenities ?? [],
            isActive: doc.isActive ?? true,
            createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
            updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
        };
    }

    async save(preferenceData: Omit<SeekerPreferenceEntity, "id">): Promise<SeekerPreferenceEntity> {
        const doc = await SeekerPreferenceModel.findOneAndUpdate(
            { userId: preferenceData.userId },
            { ...preferenceData, isActive: preferenceData.isActive ?? true },
            { upsert: true, new: true }
        ).exec();
        return this.mapToEntity(doc);
    }

    async updateStatusByUserId(userId: string, isActive: boolean): Promise<void> {
        await SeekerPreferenceModel.updateMany({ userId }, { $set: { isActive } }).exec();
    }

    async findByUserId(userId: string): Promise<SeekerPreferenceEntity | null> {
        const doc = await SeekerPreferenceModel.findOne({ userId }).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findAll(): Promise<SeekerPreferenceEntity[]> {
        const docs = await SeekerPreferenceModel.find().exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }
}
