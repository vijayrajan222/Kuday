import type { WalletEntity } from "@domain/entities/WalletEntity";
import type { WalletTransactionEntity } from "@domain/entities/WalletTransactionEntity";

export interface GetWalletOutput {
    wallet: WalletEntity;
    balancePaise: number;
    balanceRupees: number;
    transactions: WalletTransactionEntity[];
    totalTransactions: number;
    isBalanced: boolean;
}

export interface IGetWalletUseCase {
    execute(userId: string, limit?: number, skip?: number): Promise<GetWalletOutput>;
}
