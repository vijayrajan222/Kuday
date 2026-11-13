import type { ClientSession } from "mongoose";
import type { IWalletRepository } from "@application/interfaces/repository/IWalletRepository";
import type { WalletEntity } from "@domain/entities/WalletEntity";
import { walletModel, type WalletDoc } from "@infrastructure/database/model/WalletModel";
import { ValidationError } from "@application/errors/AppError";

export class MongoWalletRepository implements IWalletRepository {
    private mapToEntity(doc: WalletDoc): WalletEntity {
        return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            balance: doc.balance,
            version: doc.version,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }

    async findByUserId(userId: string, session?: unknown): Promise<WalletEntity | null> {
        const doc = await walletModel
            .findOne({ userId })
            .session((session as ClientSession) || null)
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async getOrCreateWallet(userId: string, session?: unknown): Promise<WalletEntity> {
        let doc = await walletModel
            .findOne({ userId })
            .session((session as ClientSession) || null)
            .exec();

        if (!doc) {
            const created = await walletModel.create(
                [{ userId, balance: 0, version: 0 }],
                { session: (session as ClientSession) || undefined }
            );
            const first = created[0];
            if (!first) throw new Error("Failed to create wallet");
            return this.mapToEntity(first);
        }

        return this.mapToEntity(doc);
    }

    async atomicCredit(userId: string, amount: number, session?: unknown): Promise<WalletEntity> {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new ValidationError("Credit amount must be a positive integer in paise");
        }

        const doc = await walletModel
            .findOneAndUpdate(
                { userId },
                {
                    $inc: { balance: amount, version: 1 },
                },
                {
                    returnDocument: "after",
                    upsert: true,
                    session: (session as ClientSession) || undefined,
                    runValidators: true,
                }
            )
            .exec();

        return this.mapToEntity(doc);
    }

    async atomicDebit(userId: string, amount: number, session?: unknown): Promise<WalletEntity> {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new ValidationError("Debit amount must be a positive integer in paise");
        }

        const doc = await walletModel
            .findOneAndUpdate(
                {
                    userId,
                    balance: { $gte: amount },
                },
                {
                    $inc: { balance: -amount, version: 1 },
                },
                {
                    returnDocument: "after",
                    session: (session as ClientSession) || undefined,
                    runValidators: true,
                }
            )
            .exec();

        if (!doc) {
            throw new ValidationError("Insufficient wallet balance for this transaction");
        }

        return this.mapToEntity(doc);
    }
}
