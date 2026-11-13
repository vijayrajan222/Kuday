import mongoose, { type ClientSession } from "mongoose";
import type {
    IWalletService,
    CreditWalletDTO,
    DebitWalletDTO,
} from "@application/interfaces/services/IWalletService";
import type { IWalletRepository } from "@application/interfaces/repository/IWalletRepository";
import type { IWalletTransactionRepository } from "@application/interfaces/repository/IWalletTransactionRepository";
import type { WalletEntity } from "@domain/entities/WalletEntity";
import type { WalletTransactionEntity } from "@domain/entities/WalletTransactionEntity";
import { ValidationError } from "@application/errors/AppError";

export class WalletService implements IWalletService {
    constructor(
        private readonly walletRepo: IWalletRepository,
        private readonly walletTxRepo: IWalletTransactionRepository
    ) {}

    async getWallet(userId: string): Promise<WalletEntity> {
        return this.walletRepo.getOrCreateWallet(userId);
    }

    async credit(
        dto: CreditWalletDTO,
        externalSession?: unknown
    ): Promise<{ wallet: WalletEntity; transaction: WalletTransactionEntity }> {
        if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
            throw new ValidationError("Amount must be a positive integer in paise");
        }

        // If an external session is passed, participate in that transaction directly
        if (externalSession) {
            const updatedWallet = await this.walletRepo.atomicCredit(
                dto.userId,
                dto.amount,
                externalSession
            );
            const transaction = await this.walletTxRepo.create(
                {
                    userId: dto.userId,
                    type: "credit",
                    amount: dto.amount,
                    balanceAfter: updatedWallet.balance,
                    reason: dto.reason,
                    ...(dto.referenceId ? { referenceId: dto.referenceId } : {}),
                    description: dto.description || `Wallet credited with ${dto.amount} paise`,
                },
                externalSession
            );
            return { wallet: updatedWallet, transaction };
        }

        // Otherwise create own session and commit atomically
        const session: ClientSession = await mongoose.startSession();
        let resultWallet!: WalletEntity;
        let resultTx!: WalletTransactionEntity;

        try {
            await session.withTransaction(async () => {
                resultWallet = await this.walletRepo.atomicCredit(
                    dto.userId,
                    dto.amount,
                    session
                );
                resultTx = await this.walletTxRepo.create(
                    {
                        userId: dto.userId,
                        type: "credit",
                        amount: dto.amount,
                        balanceAfter: resultWallet.balance,
                        reason: dto.reason,
                        ...(dto.referenceId ? { referenceId: dto.referenceId } : {}),
                        description: dto.description || `Wallet credited with ${dto.amount} paise`,
                    },
                    session
                );
            });
            return { wallet: resultWallet, transaction: resultTx };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            // Graceful fallback for non-replica set development MongoDB
            if (msg.includes("replica set") || msg.includes("Transaction numbers are only allowed")) {
                resultWallet = await this.walletRepo.atomicCredit(dto.userId, dto.amount);
                resultTx = await this.walletTxRepo.create({
                    userId: dto.userId,
                    type: "credit",
                    amount: dto.amount,
                    balanceAfter: resultWallet.balance,
                    reason: dto.reason,
                    ...(dto.referenceId ? { referenceId: dto.referenceId } : {}),
                    description: dto.description || `Wallet credited with ${dto.amount} paise`,
                });
                return { wallet: resultWallet, transaction: resultTx };
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async debit(
        dto: DebitWalletDTO,
        externalSession?: unknown
    ): Promise<{ wallet: WalletEntity; transaction: WalletTransactionEntity }> {
        if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
            throw new ValidationError("Amount must be a positive integer in paise");
        }

        // If an external session is passed, participate in that transaction directly
        if (externalSession) {
            const updatedWallet = await this.walletRepo.atomicDebit(
                dto.userId,
                dto.amount,
                externalSession
            );
            const transaction = await this.walletTxRepo.create(
                {
                    userId: dto.userId,
                    type: "debit",
                    amount: dto.amount,
                    balanceAfter: updatedWallet.balance,
                    reason: dto.reason,
                    ...(dto.referenceId ? { referenceId: dto.referenceId } : {}),
                    description: dto.description || `Wallet debited with ${dto.amount} paise`,
                },
                externalSession
            );
            return { wallet: updatedWallet, transaction };
        }

        // Otherwise create own session and commit atomically
        const session: ClientSession = await mongoose.startSession();
        let resultWallet!: WalletEntity;
        let resultTx!: WalletTransactionEntity;

        try {
            await session.withTransaction(async () => {
                resultWallet = await this.walletRepo.atomicDebit(
                    dto.userId,
                    dto.amount,
                    session
                );
                resultTx = await this.walletTxRepo.create(
                    {
                        userId: dto.userId,
                        type: "debit",
                        amount: dto.amount,
                        balanceAfter: resultWallet.balance,
                        reason: dto.reason,
                        ...(dto.referenceId ? { referenceId: dto.referenceId } : {}),
                        description: dto.description || `Wallet debited with ${dto.amount} paise`,
                    },
                    session
                );
            });
            return { wallet: resultWallet, transaction: resultTx };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            // Graceful fallback for non-replica set development MongoDB
            if (msg.includes("replica set") || msg.includes("Transaction numbers are only allowed")) {
                resultWallet = await this.walletRepo.atomicDebit(dto.userId, dto.amount);
                resultTx = await this.walletTxRepo.create({
                    userId: dto.userId,
                    type: "debit",
                    amount: dto.amount,
                    balanceAfter: resultWallet.balance,
                    reason: dto.reason,
                    ...(dto.referenceId ? { referenceId: dto.referenceId } : {}),
                    description: dto.description || `Wallet debited with ${dto.amount} paise`,
                });
                return { wallet: resultWallet, transaction: resultTx };
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async getTransactions(
        userId: string,
        limit = 20,
        skip = 0
    ): Promise<{ transactions: WalletTransactionEntity[]; total: number }> {
        return this.walletTxRepo.findByUserId(userId, limit, skip);
    }

    async reconcile(
        userId: string
    ): Promise<{ isBalanced: boolean; walletBalance: number; ledgerBalance: number }> {
        const wallet = await this.walletRepo.getOrCreateWallet(userId);
        const ledgerBalance = await this.walletTxRepo.calculateLedgerBalance(userId);
        return {
            isBalanced: wallet.balance === ledgerBalance,
            walletBalance: wallet.balance,
            ledgerBalance,
        };
    }
}
