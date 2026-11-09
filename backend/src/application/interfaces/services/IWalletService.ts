import type { WalletEntity } from "@domain/entities/WalletEntity";
import type {
    WalletTransactionEntity,
    WalletTransactionReason,
} from "@domain/entities/WalletTransactionEntity";

export interface CreditWalletDTO {
    userId: string;
    amount: number; // Integer in paise
    reason: WalletTransactionReason;
    referenceId?: string;
    description?: string;
}

export interface DebitWalletDTO {
    userId: string;
    amount: number; // Integer in paise
    reason: WalletTransactionReason;
    referenceId?: string;
    description?: string;
}

export interface IWalletService {
    getWallet(userId: string): Promise<WalletEntity>;
    credit(
        dto: CreditWalletDTO,
        externalSession?: unknown
    ): Promise<{ wallet: WalletEntity; transaction: WalletTransactionEntity }>;
    debit(
        dto: DebitWalletDTO,
        externalSession?: unknown
    ): Promise<{ wallet: WalletEntity; transaction: WalletTransactionEntity }>;
    getTransactions(
        userId: string,
        limit?: number,
        skip?: number
    ): Promise<{ transactions: WalletTransactionEntity[]; total: number }>;
    reconcile(
        userId: string
    ): Promise<{ isBalanced: boolean; walletBalance: number; ledgerBalance: number }>;
}
