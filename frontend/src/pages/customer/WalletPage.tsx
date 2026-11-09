import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Crown,
  Loader2,
  RefreshCw,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { paymentService } from '@/services/paymentService';
import type { WalletResponse, WalletTransaction } from '@/types/payment.types';

export default function WalletPage() {
  const navigate = useNavigate();

  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      const data = await paymentService.getWallet(50, 0);
      setWalletData(data);
    } catch {
      toast.error('Failed to load wallet details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const filteredTransactions = (walletData?.transactions || []).filter((tx) => {
    if (activeFilter === 'all') return true;
    return tx.type === activeFilter;
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const balanceRupees = ((walletData?.balancePaise || 0) / 100).toFixed(2);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <button
          type="button"
          onClick={loadWallet}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Balance Hero Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-900">
              <Wallet className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kuday Wallet Balance
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              ₹{balanceRupees}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ({walletData?.balancePaise || 0} paise)
            </span>
          </div>

          {/* Ledger Audit Badge */}
          <div className="flex items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Double-Entry Ledger Reconciled</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Ledger version: v{walletData?.wallet.version || 0}
            </span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.MEMBERSHIP)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>Manage Premium Plans</span>
          </button>
        </div>
      </div>

      {/* Transactions Ledger Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
            <p className="text-xs text-slate-500">
              Every balance update is verified by a strict transactional ledger row.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 self-start sm:self-auto">
            {(['all', 'credit', 'debit'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter === 'all' ? 'All Activity' : `${filter}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Clock className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No transactions recorded yet.</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Credits and refunds from membership cancellations or topups will appear here with full ledger audits.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx: WalletTransaction) => {
              const isCredit = tx.type === 'credit';
              const amountRupees = (tx.amount / 100).toFixed(2);
              const balanceAfterRupees = (tx.balanceAfter / 100).toFixed(2);
              const dateStr = new Date(tx.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={tx.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors px-2 rounded-xl"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {tx.description || (isCredit ? 'Wallet Credit' : 'Wallet Debit')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.reason === 'refund'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.reason === 'premium_purchase'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tx.reason.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{dateStr}</span>
                        {tx.referenceId && (
                          <span className="font-mono text-[10px] truncate max-w-[160px]">
                            Ref: {tx.referenceId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Balance After */}
                  <div className="text-right pl-11 sm:pl-0 shrink-0">
                    <span
                      className={`text-sm font-black block ${
                        isCredit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? `+₹${amountRupees}` : `-₹${amountRupees}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Balance after: ₹{balanceAfterRupees}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
