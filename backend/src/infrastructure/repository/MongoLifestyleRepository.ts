import type { ILifestyleRepository } from "@application/interfaces/repository/ILifestyleRepository.js";
import type { LifestyleEntity } from "@domain/entities/LifestyleEntity.js";
import { LifestyleModel } from "@infrastructure/database/model/LifestyleModel.js";

export class MongoLifestyleRepository implements ILifestyleRepository {
    async upsert(lifestyle: Omit<LifestyleEntity, "id">): Promise<LifestyleEntity> {
        const doc = await LifestyleModel.findOneAndUpdate(
            { userId: lifestyle.userId },
            { $set: lifestyle },
            { new: true, upsert: true }
        );
        return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            smoking: doc.smoking,
            drinking: doc.drinking,
            sleepSchedule: doc.sleepSchedule,
            diet: doc.diet,
            cleanliness: doc.cleanliness,
            visitorPolicy: doc.visitorPolicy,
            roommateGenderPref: doc.roommateGenderPref
        };
    }

    async findByUserId(userId: string): Promise<LifestyleEntity | null> {
        const doc = await LifestyleModel.findOne({ userId });
        if (!doc) return null;
        return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            smoking: doc.smoking,
            drinking: doc.drinking,
            sleepSchedule: doc.sleepSchedule,
            diet: doc.diet,
            cleanliness: doc.cleanliness,
            visitorPolicy: doc.visitorPolicy,
            roommateGenderPref: doc.roommateGenderPref
        };
    }
}
