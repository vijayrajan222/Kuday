import type { ClientSession } from "mongoose";
import type { IWalletRepository } from "@application/interfaces/repository/IWalletRepository";
import type { WalletEntity } from "@domain/entities/WalletEntity";
import { walletModel, type WalletDoc } from "@infrastructure/database/model/WalletModel";
import { AppError } from "@application/errors/AppError";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

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
            doc = created[0];
        }

        return this.mapToEntity(doc);
    }

    async atomicCredit(userId: string, amount: number, session?: unknown): Promise<WalletEntity> {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new AppError("Credit amount must be a positive integer in paise", HttpStatusCodes.BAD_REQUEST);
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
            throw new AppError("Debit amount must be a positive integer in paise", HttpStatusCodes.BAD_REQUEST);
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
            throw new AppError("Insufficient wallet balance for this transaction", HttpStatusCodes.BAD_REQUEST);
        }

        return this.mapToEntity(doc);
    }
}
