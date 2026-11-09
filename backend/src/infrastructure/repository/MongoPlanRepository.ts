import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { PlanEntity } from "@domain/entities/PlanEntity";
import { planModel, type PlanDoc } from "@infrastructure/database/model/PlanModel";

export class MongoPlanRepository implements IPlanRepository {
    private mapToEntity(doc: PlanDoc): PlanEntity {
        return {
            id: doc._id.toString(),
            name: doc.name,
            price: doc.price,
            durationDays: doc.durationDays,
            audience: (doc.audience as "host") ?? "host",
            description: doc.description ?? undefined,
            features: doc.features ? [...doc.features] : undefined,
            isActive: doc.isActive,
            createdAt: doc.createdAt ?? undefined,
            updatedAt: doc.updatedAt ?? undefined,
        };
    }

    async create(data: Omit<PlanEntity, "id" | "createdAt" | "updatedAt">): Promise<PlanEntity> {
        const doc = await planModel.create({
            name: data.name,
            price: data.price,
            durationDays: data.durationDays,
            audience: data.audience ?? "host",
            description: data.description,
            features: data.features,
            isActive: data.isActive ?? true,
        });
        return this.mapToEntity(doc);
    }

    async findById(id: string): Promise<PlanEntity | null> {
        const doc = await planModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByName(name: string): Promise<PlanEntity | null> {
        const doc = await planModel.findOne({ name }).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findAllActive(audience?: string): Promise<PlanEntity[]> {
        const filter: Record<string, unknown> = { isActive: true };
        if (audience) {
            filter.audience = audience;
        }
        const docs = await planModel.find(filter).sort({ price: 1 }).exec();
        return docs.map((d) => this.mapToEntity(d));
    }

    async count(): Promise<number> {
        return planModel.countDocuments().exec();
    }
}
