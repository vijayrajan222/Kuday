export interface AdminRevenueDataPointDto {
    date: string;
    revenue: number;
    transactionsCount: number;
    subscriptions: number;
    walletTopups: number;
}

export interface AdminTransactionItemDto {
    id: string;
    transactionId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    type: "subscription" | "wallet_topup" | "wallet_purchase" | "refund";
    method: "razorpay" | "wallet";
    amount: number;
    amountPaise: number;
    status: "captured" | "failed" | "refunded" | "pending";
    createdAt: string;
    description?: string;
}

export interface AdminRevenueSummaryDto {
    totalRevenue: number;
    monthlyRevenue: number;
    subscriptionRevenue: number;
    walletTopupRevenue: number;
    totalTransactions: number;
    successfulTransactions: number;
    chartData: AdminRevenueDataPointDto[];
    transactions: AdminTransactionItemDto[];
}
