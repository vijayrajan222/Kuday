import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { IWalletTransactionRepository } from "@application/interfaces/repository/IWalletTransactionRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IGetAdminRevenueUseCase } from "@application/interfaces/use-case/admin/IGetAdminRevenueUseCase";
import type {
    AdminRevenueSummaryDto,
    AdminRevenueDataPointDto,
    AdminTransactionItemDto,
} from "@application/dto/admin/AdminRevenueDto";

export class GetAdminRevenueUseCase implements IGetAdminRevenueUseCase {
    constructor(
        private paymentRepo: IPaymentRepository,
        private walletTxRepo: IWalletTransactionRepository,
        private userRepo: IUserRepository
    ) {}

    async execute(): Promise<AdminRevenueSummaryDto> {
        const [payments, walletResult, users] = await Promise.all([
            this.paymentRepo.findAll(),
            this.walletTxRepo.findAll(250, 0),
            this.userRepo.findAll(),
        ]);

        const userMap = new Map<string, { name: string; email: string; role: string }>();
        for (const u of users) {
            userMap.set(u.id, {
                name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "User",
                email: u.email || "",
                role: u.role || "seeker",
            });
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let subscriptionRevenue = 0;
        let walletTopupRevenue = 0;
        let successfulTransactions = 0;

        const dateAggregates = new Map<
            string,
            { revenue: number; count: number; subscriptions: number; topups: number }
        >();

        const transactions: AdminTransactionItemDto[] = [];

        for (const p of payments) {
            const isCaptured = p.status === "captured";
            const amountInRupees = Math.round((p.amount / 100) * 100) / 100;
            const pDate = p.createdAt ? new Date(p.createdAt) : new Date();
            const dateStr = pDate.toISOString().split("T")[0]!;

            if (isCaptured) {
                totalRevenue += amountInRupees;
                successfulTransactions += 1;

                if (p.purpose === "wallet_topup") {
                    walletTopupRevenue += amountInRupees;
                } else {
                    subscriptionRevenue += amountInRupees;
                }

                if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
                    monthlyRevenue += amountInRupees;
                }

                const prev = dateAggregates.get(dateStr) || {
                    revenue: 0,
                    count: 0,
                    subscriptions: 0,
                    topups: 0,
                };
                prev.revenue += amountInRupees;
                prev.count += 1;
                if (p.purpose === "wallet_topup") {
                    prev.topups += amountInRupees;
                } else {
                    prev.subscriptions += amountInRupees;
                }
                dateAggregates.set(dateStr, prev);
            }

            const userInfo = userMap.get(p.userId) || {
                name: "User",
                email: "",
                role: "seeker",
            };

            transactions.push({
                id: p.id,
                transactionId: p.razorpayPaymentId || p.razorpayOrderId,
                userId: p.userId,
                userName: userInfo.name,
                userEmail: userInfo.email,
                userRole: userInfo.role,
                type: p.purpose === "wallet_topup" ? "wallet_topup" : "subscription",
                method: "razorpay",
                amount: amountInRupees,
                amountPaise: p.amount,
                status:
                    p.status === "captured"
                        ? "captured"
                        : p.status === "refunded"
                        ? "refunded"
                        : p.status === "failed"
                        ? "failed"
                        : "pending",
                createdAt: pDate.toISOString(),
                description:
                    p.purpose === "wallet_topup"
                        ? "Wallet Top-Up via Razorpay"
                        : "Premium Plan Subscription via Razorpay",
            });
        }

        // Also add direct wallet purchases to transaction history
        for (const tx of walletResult.transactions) {
            if (tx.reason === "premium_purchase") {
                const amountInRupees = Math.round((tx.amount / 100) * 100) / 100;
                const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
                const userInfo = userMap.get(tx.userId) || {
                    name: "User",
                    email: "",
                    role: "host",
                };

                transactions.push({
                    id: tx.id,
                    transactionId: tx.referenceId || `WAL-${tx.id.slice(-8).toUpperCase()}`,
                    userId: tx.userId,
                    userName: userInfo.name,
                    userEmail: userInfo.email,
                    userRole: userInfo.role,
                    type: "wallet_purchase",
                    method: "wallet",
                    amount: amountInRupees,
                    amountPaise: tx.amount,
                    status: "captured",
                    createdAt: txDate.toISOString(),
                    description: tx.description || "Premium Membership Purchase from Wallet Balance",
                });
            }
        }

        // Sort all transactions newest first
        transactions.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Build continuous timeline for the last 14 days
        const chartData: AdminRevenueDataPointDto[] = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0]!;
            const agg = dateAggregates.get(key) || {
                revenue: 0,
                count: 0,
                subscriptions: 0,
                topups: 0,
            };
            chartData.push({
                date: key,
                revenue: Math.round(agg.revenue * 100) / 100,
                transactionsCount: agg.count,
                subscriptions: Math.round(agg.subscriptions * 100) / 100,
                walletTopups: Math.round(agg.topups * 100) / 100,
            });
        }

        return {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
            subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
            walletTopupRevenue: Math.round(walletTopupRevenue * 100) / 100,
            totalTransactions: transactions.length,
            successfulTransactions,
            chartData,
            transactions,
        };
    }
}
