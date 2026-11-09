import type { ClientSession } from "mongoose";
import type { IWalletTransactionRepository } from "@application/interfaces/repository/IWalletTransactionRepository";
import type { WalletTransactionEntity } from "@domain/entities/WalletTransactionEntity";
import {
    walletTransactionModel,
    type WalletTransactionDoc,
} from "@infrastructure/database/model/WalletTransactionModel";

export class MongoWalletTransactionRepository implements IWalletTransactionRepository {
    private mapToEntity(doc: WalletTransactionDoc): WalletTransactionEntity {
        return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            type: doc.type as "credit" | "debit",
            amount: doc.amount,
            balanceAfter: doc.balanceAfter,
            reason: doc.reason as "topup" | "premium_purchase" | "refund",
            referenceId: doc.referenceId ?? undefined,
            description: doc.description ?? undefined,
            createdAt: doc.createdAt,
        };
    }

    async create(
        data: Omit<WalletTransactionEntity, "id" | "createdAt">,
        session?: unknown
    ): Promise<WalletTransactionEntity> {
        const payload: Record<string, unknown> = {
            userId: data.userId,
            type: data.type,
            amount: data.amount,
            balanceAfter: data.balanceAfter,
            reason: data.reason,
        };
        if (data.referenceId) payload.referenceId = data.referenceId;
        if (data.description) payload.description = data.description;

        const created = await walletTransactionModel.create(
            [payload],
            session ? { session: session as ClientSession } : undefined
        );
        return this.mapToEntity(created[0]!);
    }

    async findByUserId(
        userId: string,
        limit = 20,
        skip = 0
    ): Promise<{ transactions: WalletTransactionEntity[]; total: number }> {
        const [docs, total] = await Promise.all([
            walletTransactionModel
                .find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            walletTransactionModel.countDocuments({ userId }).exec(),
        ]);

        return {
            transactions: docs.map((d) => this.mapToEntity(d)),
            total,
        };
    }

    async calculateLedgerBalance(userId: string): Promise<number> {
        const result = await walletTransactionModel.aggregate([
            { $match: { userId: typeof userId === "string" ? new (await import("mongoose")).Types.ObjectId(userId) : userId } },
            {
                $group: {
                    _id: null,
                    totalCredits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0],
                        },
                    },
                    totalDebits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0],
                        },
                    },
                },
            },
        ]);

        if (!result || result.length === 0) return 0;
        return (result[0].totalCredits || 0) - (result[0].totalDebits || 0);
    }
}
