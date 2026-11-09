import type { WalletEntity } from "@domain/entities/WalletEntity";

export interface IWalletRepository {
    findByUserId(userId: string, session?: unknown): Promise<WalletEntity | null>;
    getOrCreateWallet(userId: string, session?: unknown): Promise<WalletEntity>;
    atomicCredit(userId: string, amount: number, session?: unknown): Promise<WalletEntity>;
    atomicDebit(userId: string, amount: number, session?: unknown): Promise<WalletEntity>;
}
