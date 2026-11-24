import type { IWalletService } from "@application/interfaces/services/IWalletService";
import type { IGetWalletUseCase } from "@application/interfaces/use-case/wallet/IGetWalletUseCase";
import type {
    GetWalletInputDto,
    GetWalletOutputDto,
    GetWalletOutput,
} from "@application/dto/wallet/WalletDto";

export type { GetWalletOutput, GetWalletOutputDto, GetWalletInputDto };

export class GetWalletUseCase implements IGetWalletUseCase {
    constructor(private readonly walletService: IWalletService) {}

    async execute(
        inputOrUserId: GetWalletInputDto | string,
        limitParam = 20,
        skipParam = 0
    ): Promise<GetWalletOutputDto> {
        const userId = typeof inputOrUserId === "object" ? inputOrUserId.userId : inputOrUserId;
        const limit = typeof inputOrUserId === "object" ? (inputOrUserId.limit ?? 20) : limitParam;
        const skip = typeof inputOrUserId === "object" ? (inputOrUserId.skip ?? 0) : skipParam;

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
