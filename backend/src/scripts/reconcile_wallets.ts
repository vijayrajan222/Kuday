import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectMongo } from "../infrastructure/database/ConnectMongoDB";
import { walletModel } from "../infrastructure/database/model/WalletModel";
import { walletTransactionModel } from "../infrastructure/database/model/WalletTransactionModel";

export interface ReconciliationReport {
    totalWalletsAudited: number;
    balancedCount: number;
    discrepancyCount: number;
    totalSystemBalancePaise: number;
    totalSystemBalanceRupees: number;
    discrepancies: Array<{
        userId: string;
        walletBalance: number;
        ledgerBalance: number;
        diff: number;
    }>;
}

export async function runReconciliationAudit(): Promise<ReconciliationReport> {
    const wallets = await walletModel.find().lean().exec();

    let balancedCount = 0;
    let discrepancyCount = 0;
    let totalSystemBalancePaise = 0;
    const discrepancies: ReconciliationReport["discrepancies"] = [];

    for (const wallet of wallets) {
        totalSystemBalancePaise += wallet.balance;

        // Calculate ledger sum
        const result = await walletTransactionModel.aggregate([
            { $match: { userId: wallet.userId } },
            {
                $group: {
                    _id: null,
                    totalCredits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0],
                        },
                    },
                    totalDebits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0],
                        },
                    },
                },
            },
        ]);

        const totalCredits = result[0]?.totalCredits || 0;
        const totalDebits = result[0]?.totalDebits || 0;
        const ledgerBalance = totalCredits - totalDebits;

        if (wallet.balance === ledgerBalance) {
            balancedCount++;
        } else {
            discrepancyCount++;
            discrepancies.push({
                userId: wallet.userId.toString(),
                walletBalance: wallet.balance,
                ledgerBalance,
                diff: wallet.balance - ledgerBalance,
            });
        }
    }

    return {
        totalWalletsAudited: wallets.length,
        balancedCount,
        discrepancyCount,
        totalSystemBalancePaise,
        totalSystemBalanceRupees: totalSystemBalancePaise / 100,
        discrepancies,
    };
}

// Standalone CLI execution
if (process.argv[1]?.includes("reconcile_wallets")) {
    async function main() {
        console.log("=== KUDAY WALLET & LEDGER SYSTEM-WIDE RECONCILIATION AUDIT ===");
        await connectMongo();

        const report = await runReconciliationAudit();

        console.log("------------------------------------------------------------");
        console.log(`Total Wallets Audited:      ${report.totalWalletsAudited}`);
        console.log(`Balanced (100% Verified):   ${report.balancedCount}`);
        console.log(`Discrepancies Found:        ${report.discrepancyCount}`);
        console.log(`Total System Balance:       ₹${report.totalSystemBalanceRupees.toFixed(2)} (${report.totalSystemBalancePaise} paise)`);
        console.log("------------------------------------------------------------");

        if (report.discrepancyCount > 0) {
            console.error("❌ AUDIT FAILED! The following wallets failed reconciliation:");
            console.table(report.discrepancies);
            process.exit(1);
        } else {
            console.log("✅ AUDIT PASSED! All wallets are 100% mathematically balanced with the ledger.");
            process.exit(0);
        }
    }

    main().catch((err) => {
        console.error("Reconciliation script failed:", err);
        process.exit(1);
    });
}
