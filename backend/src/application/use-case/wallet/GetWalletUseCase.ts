import type { IWalletService } from "@application/interfaces/services/IWalletService";
import type { WalletEntity } from "@domain/entities/WalletEntity";
import type { WalletTransactionEntity } from "@domain/entities/WalletTransactionEntity";
import type {
    IGetWalletUseCase,
    GetWalletOutput,
} from "@application/interfaces/use-case/wallet/IGetWalletUseCase";

export type { GetWalletOutput };

export class GetWalletUseCase implements IGetWalletUseCase {
    constructor(private readonly walletService: IWalletService) {}

    async execute(userId: string, limit = 20, skip = 0): Promise<GetWalletOutput> {
        const wallet = await this.walletService.getWallet(userId);
        const { transactions, total } = await this.walletService.getTransactions(userId, limit, skip);
        const recon = await this.walletService.reconcile(userId);

        return {
            wallet,
            balancePaise: wallet.balance,
            balanceRupees: wallet.balance / 100,
            transactions,
            totalTransactions: total,
            isBalanced: recon.isBalanced,
        };
    }
}
