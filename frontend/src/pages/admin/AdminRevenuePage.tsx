import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { AdminRevenueSummary } from '@/types/admin.types';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorHandler';

export default function AdminRevenuePage() {
  const [revenueData, setRevenueData] = useState<AdminRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  const loadRevenue = useCallback(async () => {
    try {
      const data = await adminService.getRevenue();
      setRevenueData(data);
    } catch (err) {
      toast.error(`Failed to load revenue data: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadRevenue();
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    if (!revenueData?.transactions) return [];
    let list = [...revenueData.transactions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.userName.toLowerCase().includes(q) ||
          t.userEmail.toLowerCase().includes(q) ||
          t.transactionId.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (selectedType !== 'all') {
      list = list.filter((t) => t.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      list = list.filter((t) => t.status === selectedStatus);
    }

    return list;
  }, [revenueData?.transactions, searchQuery, selectedType, selectedStatus]);

  // Paginated Transactions
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">Revenue & Financial Analytics</h1>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial transactions, user subscription income, and wallet ledger tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total App Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {loading ? '...' : formatCurrency(revenueData?.totalRevenue || 0)}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Gross platform cashflow</span>
            </div>
          </div>
        </div>

        {/* Current Month Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Month</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {loading ? '...' : formatCurrency(revenueData?.monthlyRevenue || 0)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Current calendar billing cycle</p>
          </div>
        </div>

        {/* Subscription Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscriptions</span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {loading ? '...' : formatCurrency(revenueData?.subscriptionRevenue || 0)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Premium membership plans</p>
          </div>
        </div>

        {/* Wallet Top-Ups Volume */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wallet Top-Ups</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {loading ? '...' : formatCurrency(revenueData?.walletTopupRevenue || 0)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Deposited to user wallets</p>
          </div>
        </div>
      </div>

      {/* Main Revenue Chart */}
      <RevenueChart
        data={revenueData?.chartData || []}
        title="Revenue & Daily Generation Timeseries"
        height={320}
      />

      {/* User Transactions Table Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl space-y-5">
        {/* Table Controls Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="h-4 w-4 text-indigo-400" /> User Transactions Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'} recorded on the platform
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search user, email, or txn ID..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="all">All Types</option>
              <option value="subscription">Subscriptions</option>
              <option value="wallet_topup">Wallet Top-Ups</option>
              <option value="wallet_purchase">Wallet Purchases</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="captured">Captured / Success</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading transactions ledger...
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No transactions match your current filters.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* User Column */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{tx.userName}</span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                              tx.userRole === 'host'
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            }`}
                          >
                            {tx.userRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{tx.userEmail}</p>
                      </div>
                    </td>

                    {/* Transaction Reference */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-300 font-semibold">
                      {tx.transactionId}
                    </td>

                    {/* Purpose */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-300 block">{tx.description || tx.type}</span>
                    </td>

                    {/* Method */}
                    <td className="py-3.5 px-4">
                      {tx.method === 'razorpay' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                          <CreditCard className="h-3 w-3" /> Razorpay Gateway
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          <Wallet className="h-3 w-3" /> Wallet Balance
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {formatCurrency(tx.amount)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {tx.status === 'captured' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Successful
                        </span>
                      ) : tx.status === 'refunded' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          <RotateCcw className="h-3 w-3" /> Refunded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                          <XCircle className="h-3 w-3" /> {tx.status}
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px] font-medium whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div>
              Page <span className="font-bold text-slate-200">{currentPage}</span> of{' '}
              <span className="font-bold text-slate-200">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
