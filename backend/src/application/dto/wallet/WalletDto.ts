import type { WalletEntity } from "@domain/entities/WalletEntity";
import type { WalletTransactionEntity } from "@domain/entities/WalletTransactionEntity";

export interface GetWalletInputDto {
    userId: string;
    limit?: number | undefined;
    skip?: number | undefined;
}

export interface GetWalletOutputDto {
    wallet: WalletEntity;
    balancePaise: number;
    balanceRupees: number;
    transactions: WalletTransactionEntity[];
    totalTransactions: number;
    isBalanced: boolean;
}

// Alias for backwards compatibility
export type GetWalletOutput = GetWalletOutputDto;
