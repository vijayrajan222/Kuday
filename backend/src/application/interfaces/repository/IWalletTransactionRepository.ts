import type { WalletTransactionEntity } from "@domain/entities/WalletTransactionEntity";

export interface IWalletTransactionRepository {
    create(
        data: Omit<WalletTransactionEntity, "id" | "createdAt">,
        session?: unknown
    ): Promise<WalletTransactionEntity>;
    findByUserId(
        userId: string,
        limit?: number,
        skip?: number
    ): Promise<{ transactions: WalletTransactionEntity[]; total: number }>;
    calculateLedgerBalance(userId: string): Promise<number>;
}
