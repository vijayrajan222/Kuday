import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle2,
  Eye,
  Ban,
  Clock,
  ExternalLink,
  X,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { ReportItem, ReportStatus } from '@/types/report.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorHandler';

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  harassment: {
    label: 'Harassment & Abuse',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  fake_profile_or_listing: {
    label: 'Fake Profile / Listing',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  scam_fraud: {
    label: 'Scam & Financial Fraud',
    color: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
  inappropriate_behavior: {
    label: 'Inappropriate Conduct',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  spam: {
    label: 'Spam & Solicitation',
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
  other: {
    label: 'Other Policy Concern',
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [inspectReport, setInspectReport] = useState<ReportItem | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Review & Notify Reporter Modal
  const [reviewModalReport, setReviewModalReport] = useState<ReportItem | null>(null);
  const [reviewTargetStatus, setReviewTargetStatus] = useState<ReportStatus>('reviewed');
  const [reporterMessageInput, setReporterMessageInput] = useState('');

  // Issue Safety Warning Modal
  const [warnModalReport, setWarnModalReport] = useState<ReportItem | null>(null);
  const [warningMessageInput, setWarningMessageInput] = useState('');
  const [warningLoading, setWarningLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const loadReports = useCallback(async () => {
    try {
      const data = await adminService.getReports(statusFilter);
      setReports(data || []);
    } catch (err) {
      toast.error(`Failed to load incident reports: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    loadReports();
  }, [loadReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  // Status Change Handler
  const handleUpdateStatus = async (
    reportId: string,
    newStatus: ReportStatus,
    note?: string,
    reporterMsg?: string
  ) => {
    try {
      setActionLoadingId(reportId);
      const updated = await adminService.updateReportStatus(
        reportId,
        newStatus,
        note,
        reporterMsg
      );
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: updated.status, adminNotes: updated.adminNotes, warningIssued: updated.warningIssued, warningMessage: updated.warningMessage }
            : r
        )
      );
      if (newStatus === 'reviewed' || newStatus === 'resolved') {
        toast.success(`Report marked as ${newStatus}. Confirmation sent to reporter.`);
      } else {
        toast.success(`Report marked as ${newStatus}`);
      }
      if (inspectReport?.id === reportId) {
        setInspectReport(null);
      }
    } catch (err) {
      toast.error(`Failed to update report: ${getErrorMessage(err)}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReviewModal = (report: ReportItem, targetStatus: ReportStatus) => {
    setReviewModalReport(report);
    setReviewTargetStatus(targetStatus);
    setReporterMessageInput(
      'Your report has been reviewed and necessary action will be taken. Thank you for helping keep Kuday safe.'
    );
  };

  const handleConfirmReviewAndNotify = async () => {
    if (!reviewModalReport) return;
    await handleUpdateStatus(
      reviewModalReport.id,
      reviewTargetStatus,
      reviewModalReport.adminNotes,
      reporterMessageInput.trim()
    );
    setReviewModalReport(null);
  };

  const handleOpenWarnModal = (report: ReportItem) => {
    setWarnModalReport(report);
    const reasonLabel = REASON_LABELS[report.reason]?.label || report.reason;
    setWarningMessageInput(
      `Official Safety Warning: Your account has received an incident report regarding "${reasonLabel}". Please strictly adhere to community guidelines and respectful conduct. Continued violations may result in account suspension or termination.`
    );
  };

  const handleSendWarning = async () => {
    if (!warnModalReport) return;
    if (!warningMessageInput.trim()) {
      toast.error('Please enter a warning message.');
      return;
    }
    try {
      setWarningLoading(true);
      const updated = await adminService.warnReportedUser(
        warnModalReport.id,
        warningMessageInput.trim()
      );
      setReports((prev) =>
        prev.map((r) =>
          r.id === warnModalReport.id
            ? {
                ...r,
                warningIssued: updated.warningIssued,
                warningMessage: updated.warningMessage,
                warningIssuedAt: updated.warningIssuedAt,
                adminNotes: updated.adminNotes,
              }
            : r
        )
      );
      toast.success(
        `Official safety warning sent to ${warnModalReport.reportedUser?.firstName || 'user'}.`
      );
      setWarnModalReport(null);
    } catch (err) {
      toast.error(`Failed to deliver warning: ${getErrorMessage(err)}`);
    } finally {
      setWarningLoading(false);
    }
  };

  // Block/Unblock Reported User Shortcut
  const handleToggleBlock = async (userId: string, userName: string) => {
    try {
      setActionLoadingId(userId);
      const res = await adminService.toggleBlock(userId);
      toast.success(
        res.isBlocked
          ? `User ${userName} has been BLOCKED from the platform.`
          : `User ${userName} has been unblocked.`
      );
    } catch (err) {
      toast.error(`Failed to change block status: ${getErrorMessage(err)}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Reason filter
      if (reasonFilter !== 'all' && item.reason !== reasonFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const reportedName = `${item.reportedUser?.firstName || ''} ${item.reportedUser?.lastName || ''}`.toLowerCase();
        const reporterName = `${item.reporter?.firstName || ''} ${item.reporter?.lastName || ''}`.toLowerCase();
        const reportedEmail = (item.reportedUser?.email || '').toLowerCase();
        const reporterEmail = (item.reporter?.email || '').toLowerCase();
        const messageText = (item.message || '').toLowerCase();
        const reportId = (item.id || '').toLowerCase();

        return (
          reportedName.includes(q) ||
          reporterName.includes(q) ||
          reportedEmail.includes(q) ||
          reporterEmail.includes(q) ||
          messageText.includes(q) ||
          reportId.includes(q)
        );
      }
      return true;
    });
  }, [reports, statusFilter, reasonFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  // Aggregate metrics
  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const reviewedCount = reports.filter((r) => r.status === 'reviewed').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Community Incident &amp; Safety Reports
            </h1>
            <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Trust &amp; Safety Center
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review user-submitted reports, inspect attached screenshot evidence, and take disciplinary moderation actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh Reports
          </Button>
        </div>
      </div>

      {/* 4 Key Summary Counter Tiles */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Reports */}
        <Card className="p-5 border-slate-800 bg-slate-950/80 text-slate-100 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Reports Submitted</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {reports.length}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">All-Time Incident Submissions</p>
          </div>
        </Card>

        {/* Pending Moderation */}
        <Card className="p-5 border-rose-900/40 bg-gradient-to-br from-slate-950 via-slate-950 to-rose-950/20 text-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Pending Review</span>
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {pendingCount}
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                Action Required
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting Admin Moderation</p>
        </Card>

        {/* Reviewed Reports */}
        <Card className="p-5 border-slate-800 bg-slate-950/80 text-slate-100 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Under Investigation</span>
            <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400 border border-sky-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-sky-300 tracking-tight">
              {reviewedCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Marked Under Review</p>
          </div>
        </Card>

        {/* Resolved & Dismissed */}
        <Card className="p-5 border-slate-800 bg-slate-950/80 text-slate-100 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Resolved / Dismissed</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {resolvedCount + dismissedCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {resolvedCount} Resolved • {dismissedCount} Dismissed
            </p>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {[
              { id: 'all', label: 'All Reports', count: reports.length },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'reviewed', label: 'Reviewed', count: reviewedCount },
              { id: 'resolved', label: 'Resolved', count: resolvedCount },
              { id: 'dismissed', label: 'Dismissed', count: dismissedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.id === 'pending' && tab.count > 0
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Reason dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search reporter, user, text..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs h-9 bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 w-full"
              />
            </div>

            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Incident Reasons</option>
              <option value="harassment">Harassment &amp; Abuse</option>
              <option value="fake_profile_or_listing">Fake Profile / Listing</option>
              <option value="scam_fraud">Scam &amp; Fraud</option>
              <option value="inappropriate_behavior">Inappropriate Conduct</option>
              <option value="spam">Spam &amp; Solicitation</option>
              <option value="other">Other Concern</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
          <p className="text-xs">Loading incident reports and evidence...</p>
        </div>
      ) : paginatedReports.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No reports matching your criteria</h3>
          <p className="text-xs text-slate-500">
            There are currently no safety reports matching the selected status or search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReports.map((report) => {
            const reasonMeta = REASON_LABELS[report.reason] || {
              label: report.reason.replace(/_/g, ' '),
              color: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
            };

            const isPending = report.status === 'pending';
            const reportedFullName = `${report.reportedUser?.firstName || 'User'} ${report.reportedUser?.lastName || ''}`.trim();
            const reporterFullName = `${report.reporter?.firstName || 'Reporter'} ${report.reporter?.lastName || ''}`.trim();

            return (
              <Card
                key={report.id}
                className={`p-5 sm:p-6 border transition-all ${
                  isPending
                    ? 'border-rose-900/50 bg-slate-950/90 shadow-lg shadow-rose-950/10'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left Column: User Profiles & Incident Details */}
                  <div className="space-y-4 flex-1">
                    {/* Header line: Reason badge, Status, and Date */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border ${reasonMeta.color}`}>
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>{reasonMeta.label}</span>
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${
                          report.status === 'pending'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : report.status === 'reviewed'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : report.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
                        }`}
                      >
                        {report.status}
                      </span>

                      {/* Warning Issued Badge */}
                      {report.warningIssued && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-amber-500/20 text-amber-300 border-amber-500/40">
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                          <span>Warning Issued</span>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        Filed {report.createdAt ? new Date(report.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                      </span>
                    </div>

                    {/* Parties Involved Grid: Reported User & Reporter */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Reported User (Target) */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                            {report.reportedUser?.selfieUrl ? (
                              <img
                                src={report.reportedUser.selfieUrl}
                                alt={reportedFullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-rose-950">
                                {reportedFullName[0] || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                              Reported User
                            </span>
                            <p className="text-xs font-bold text-white truncate">{reportedFullName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{report.reportedUser?.email}</p>
                          </div>
                        </div>

                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 capitalize shrink-0 border border-slate-700">
                          {report.reportedUser?.role || 'User'}
                        </span>
                      </div>

                      {/* Reporter */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                            {report.reporter?.selfieUrl ? (
                              <img
                                src={report.reporter.selfieUrl}
                                alt={reporterFullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-slate-800">
                                {reporterFullName[0] || 'R'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Reporter (Complainant)
                            </span>
                            <p className="text-xs font-bold text-white truncate">{reporterFullName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{report.reporter?.email}</p>
                          </div>
                        </div>

                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 capitalize shrink-0 border border-slate-700">
                          {report.reporter?.role || 'User'}
                        </span>
                      </div>
                    </div>

                    {/* Report Explanation Text */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Complainant Statement:
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed italic">
                        &quot;{report.message}&quot;
                      </p>
                    </div>

                    {/* Official Warning Sent Display (if any) */}
                    {report.warningIssued && report.warningMessage && (
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 space-y-1">
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Safety Warning Delivered to Reported User:
                        </span>
                        <p className="text-slate-300 text-[11px] leading-relaxed italic">
                          &quot;{report.warningMessage}&quot;
                        </p>
                        {report.warningIssuedAt && (
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            Delivered on {new Date(report.warningIssuedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Admin Notes (if any) */}
                    {report.adminNotes && (
                      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200 space-y-1">
                        <span className="font-bold text-indigo-400 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> Admin Moderation Notes:
                        </span>
                        <p className="text-slate-300 text-[11px]">{report.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Screenshot Proof & Moderation Action Buttons */}
                  <div className="w-full lg:w-72 space-y-4 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6 pt-4 lg:pt-0">
                    {/* Proof Screenshot Image Card */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Screenshot Evidence</span>
                      </span>

                      {report.screenshotUrl ? (
                        <div
                          onClick={() => setZoomImage(report.screenshotUrl || null)}
                          className="group relative h-36 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer shadow-md hover:border-indigo-500 transition-all"
                          title="Click to view full-resolution screenshot"
                        >
                          <img
                            src={report.screenshotUrl}
                            alt="Screenshot proof"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                            <Eye className="h-4 w-4 text-indigo-300" />
                            <span>Click to Zoom</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 w-full rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-500 bg-slate-900/40">
                          <span>No screenshot attached</span>
                        </div>
                      )}
                    </div>

                    {/* Moderation Actions */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Admin Decision:
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        {report.status !== 'reviewed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReviewModal(report, 'reviewed')}
                            disabled={actionLoadingId === report.id}
                            className="text-xs h-8 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 justify-center"
                          >
                            Mark Reviewed
                          </Button>
                        )}

                        {report.status !== 'resolved' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenReviewModal(report, 'resolved')}
                            disabled={actionLoadingId === report.id}
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white justify-center shadow-sm"
                          >
                            Resolve Report
                          </Button>
                        )}

                        {report.status !== 'dismissed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            disabled={actionLoadingId === report.id}
                            className="text-xs h-8 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 justify-center"
                          >
                            Dismiss
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInspectReport(report);
                            setAdminNoteInput(report.adminNotes || '');
                          }}
                          className="text-xs h-8 border-slate-700 text-indigo-300 hover:bg-indigo-950/40 hover:border-indigo-600 justify-center"
                        >
                          Add Note
                        </Button>
                      </div>

                      {/* Issue Safety Warning Button */}
                      {report.reportedUserId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenWarnModal(report)}
                          disabled={actionLoadingId === report.id}
                          className="w-full text-xs h-8 border-amber-800/60 text-amber-400 hover:bg-amber-950/50 hover:border-amber-600 justify-center mt-1"
                          leftIcon={<AlertTriangle className="h-3 w-3 text-amber-400" />}
                        >
                          {report.warningIssued ? 'Issue Another Warning' : 'Issue Safety Warning'}
                        </Button>
                      )}

                      {/* Block User Shortcut */}
                      {report.reportedUserId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleBlock(report.reportedUserId, reportedFullName)}
                          disabled={actionLoadingId === report.reportedUserId}
                          className="w-full text-xs h-8 border-rose-900/60 text-rose-400 hover:bg-rose-950/50 hover:border-rose-700 justify-center mt-1"
                          leftIcon={<Ban className="h-3 w-3" />}
                        >
                          Toggle Block Reported User
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
          <span>
            Showing page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({filteredReports.length} reports)
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-xs h-8 border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-xs h-8 border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Screenshot Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-400" /> Proof Screenshot Evidence
              </span>

              <div className="flex items-center gap-3">
                <a
                  href={zoomImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                >
                  <span>Open Full in New Tab</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setZoomImage(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-black flex items-center justify-center p-2">
              <img
                src={zoomImage}
                alt="Enlarged screenshot proof"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Note Modal */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add Moderation Note</h3>
              <button
                type="button"
                onClick={() => setInspectReport(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-medium">
                Admin Notes &amp; Actions Taken:
              </label>
              <textarea
                rows={4}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Document actions taken (e.g. warning issued to host, user suspended for 7 days, false claim dismissed)..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInspectReport(null)}
                className="text-xs border-slate-700 bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateStatus(inspectReport.id, inspectReport.status, adminNoteInput)}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Notify Reporter Confirmation Modal */}
      {reviewModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Mark as {reviewTargetStatus === 'reviewed' ? 'Reviewed' : 'Resolved'}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Notify the reporter that the report was investigated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalReport(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block">Complainant / Reporter:</span>
              <p className="text-white font-bold">
                {reviewModalReport.reporter?.firstName} {reviewModalReport.reporter?.lastName || ''} ({reviewModalReport.reporter?.email})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 block font-medium">
                Notification Message to Reporter:
              </label>
              <textarea
                rows={3}
                value={reporterMessageInput}
                onChange={(e) => setReporterMessageInput(e.target.value)}
                placeholder="Your report has been reviewed and necessary action will be taken..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-400">
                This confirmation will appear in the reporter&apos;s notification bell and trigger a real-time prompt.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReviewModalReport(null)}
                className="text-xs border-slate-700 bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReviewAndNotify}
                disabled={actionLoadingId === reviewModalReport.id}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Confirm &amp; Notify Reporter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Safety Warning Modal */}
      {warnModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-900/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Issue Official Safety Warning</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Send an official warning to the reported account holder.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWarnModalReport(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target User:</span>
                <span className="text-white font-bold">
                  {warnModalReport.reportedUser?.firstName} {warnModalReport.reportedUser?.lastName || ''} ({warnModalReport.reportedUser?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Report Category:</span>
                <span className="text-amber-400 font-medium capitalize">
                  {REASON_LABELS[warnModalReport.reason]?.label || warnModalReport.reason}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 block font-medium">
                Official Warning Text:
              </label>
              <textarea
                rows={4}
                value={warningMessageInput}
                onChange={(e) => setWarningMessageInput(e.target.value)}
                placeholder="Official Safety Warning: Your account has received an incident report..."
                className="w-full rounded-2xl border border-amber-800/40 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400">
                This official notice is saved to the report and sent directly to the user as a high-visibility warning notification.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWarnModalReport(null)}
                className="text-xs border-slate-700 bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendWarning}
                disabled={warningLoading || !warningMessageInput.trim()}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold"
                leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}
              >
                {warningLoading ? 'Sending Warning...' : 'Send Warning to User'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
