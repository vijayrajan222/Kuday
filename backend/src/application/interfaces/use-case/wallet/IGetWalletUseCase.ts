import type {
    GetWalletInputDto,
    GetWalletOutputDto,
    GetWalletOutput,
} from "@application/dto/wallet/WalletDto";

export type { GetWalletInputDto, GetWalletOutputDto, GetWalletOutput };

export interface IGetWalletUseCase {
    execute(input: GetWalletInputDto): Promise<GetWalletOutputDto>;
    execute(userId: string, limit?: number, skip?: number): Promise<GetWalletOutputDto>;
    execute(inputOrUserId: GetWalletInputDto | string, limit?: number, skip?: number): Promise<GetWalletOutputDto>;
}
