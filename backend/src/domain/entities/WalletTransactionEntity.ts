export type WalletTransactionType = 'credit' | 'debit';
export type WalletTransactionReason = 'topup' | 'premium_purchase' | 'premium_refund' | 'refund';

export interface WalletTransactionEntity {
    id: string;
    userId: string;
    type: WalletTransactionType;
    amount: number; // Integer in paise
    balanceAfter: number; // Integer in paise
    reason: WalletTransactionReason;
    referenceId?: string | undefined;
    description?: string | undefined;
    createdAt?: Date | undefined;
}
