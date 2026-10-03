import type { Model, Document } from "mongoose";

export abstract class BaseRepository<TEntity, TDoc extends Document> {
    protected constructor(protected readonly model: Model<TDoc>) {}

    protected abstract mapToEntity(doc: TDoc): TEntity;

    async findByIdGeneric(id: string): Promise<TEntity | null> {
        const doc = await this.model.findById(id).exec();
        if (!doc) return null;
        return this.mapToEntity(doc);
    }

    async findAllGeneric(): Promise<TEntity[]> {
        const docs = await this.model.find().exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async deleteGeneric(id: string): Promise<boolean> {
        const res = await this.model.findByIdAndDelete(id).exec();
        return Boolean(res);
    }
}
