export interface WalletEntity {
    id: string;
    userId: string;
    balance: number; // Integer in paise
    version: number;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}
