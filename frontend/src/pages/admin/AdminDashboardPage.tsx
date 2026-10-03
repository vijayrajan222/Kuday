import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  Sparkles,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Eye,
  Ban,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { AdminStats, AdminUser } from '@/types/admin.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorHandler';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verifications' | 'users'>('verifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Inspection Modal State
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);
  const [rejectUser, setRejectUser] = useState<AdminUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Pagination State
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const userPageSize = 5;

  const [verificationCurrentPage, setVerificationCurrentPage] = useState(1);
  const verificationPageSize = 4;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData || []);
    } catch (err) {
      toast.error(`Failed to load admin data: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [statsData, usersData] = await Promise.all([
          adminService.getStats(),
          adminService.getUsers(),
        ]);
        if (isMounted) {
          setStats(statsData);
          setUsers(usersData || []);
        }
      } catch (err) {
        if (isMounted) {
          toast.error(`Failed to load admin data: ${getErrorMessage(err)}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Approve Identity Verification
  const handleApprove = async (userId: string) => {
    try {
      setSubmittingId(userId);
      await adminService.verifyIdentity(userId, 'approve');
      toast.success('User identity verified with Kuday Room AI successfully!');
      if (inspectUser?.id === userId) setInspectUser(null);
      await loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingId(null);
    }
  };

  // Handle Reject Identity Verification
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectUser) return;
    try {
      setSubmittingId(rejectUser.id);
      await adminService.verifyIdentity(rejectUser.id, 'reject', rejectionReason);
      toast.success(`Verification rejected for ${rejectUser.firstName}`);
      setRejectUser(null);
      setRejectionReason('');
      await loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingId(null);
    }
  };

  // Handle Toggle Block User
  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      setSubmittingId(userId);
      const res = await adminService.toggleBlock(userId);
      toast.success(res.message || (currentBlocked ? 'User unblocked' : 'User blocked'));
      await loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingId(null);
    }
  };

  const pendingUsers = users.filter((u) => u.identityStatus === 'pending');
  const totalVerificationPages = Math.ceil(pendingUsers.length / verificationPageSize) || 1;
  const paginatedPendingUsers = pendingUsers.slice(
    (verificationCurrentPage - 1) * verificationPageSize,
    verificationCurrentPage * verificationPageSize
  );

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });
  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (userCurrentPage - 1) * userPageSize,
    userCurrentPage * userPageSize
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Kuday Room Match AI Admin</span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Room Control Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review property owner (host) and room seeker identities (Selfie & Government ID card) to enable room matching
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Metrics Counter Cards (4 Essential Grid Tiles) */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Property Owners (Hosts) Count */}
        <Card className="p-5 border-slate-800 bg-slate-950/80 text-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Property Owners (Hosts)</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {stats?.hostsCount || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Registered Room Owners</p>
          </div>
        </Card>

        {/* Room Seekers Count */}
        <Card className="p-5 border-slate-800 bg-slate-950/80 text-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Room Seekers</span>
            <div className="rounded-xl bg-teal-500/10 p-2 text-teal-400 border border-teal-500/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-teal-300 tracking-tight">
              {stats?.seekersCount || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Looking for Room Matches</p>
          </div>
        </Card>

        {/* Pending Identity Reviews */}
        <Card className="p-5 border-slate-800 bg-slate-950/80 text-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Identity Reviews</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {stats?.pendingVerifications || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Selfie & ID Document Queue</p>
          </div>
        </Card>

        {/* Room AI Verified Members Count */}
        <Card className="p-5 border-slate-800 bg-slate-950/80 text-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Room AI Verified</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-indigo-300 tracking-tight">
              {stats?.verifiedUsers || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Verified Members ({stats?.totalUsers || 0} Total)
            </p>
          </div>
        </Card>
      </div>

      {/* Essential Navigation Tabs Bar */}
      <div className="flex border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('verifications')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'verifications'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pending Identity Verifications ({pendingUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Seekers & Property Owners Directory ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING IDENTITY VERIFICATION QUEUE */}
      {activeTab === 'verifications' && (
        <div className="space-y-6" id="verifications">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-400" />
              <span>Room Verification Queue</span>
              <span className="text-xs font-medium text-slate-400">
                ({pendingUsers.length} user document submissions pending review)
              </span>
            </h2>
          </div>

          {paginatedPendingUsers.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {paginatedPendingUsers.map((userItem) => (
                  <Card
                    key={userItem.id}
                    className="p-6 border-slate-800 bg-slate-950/90 text-slate-100 shadow-xl space-y-5 rounded-2xl"
                  >
                    {/* User Profile Summary Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {userItem.selfieUrl ? (
                          <img
                            src={userItem.selfieUrl}
                            alt={userItem.firstName}
                            className="h-12 w-12 rounded-full object-cover border-2 border-indigo-500/50 shadow"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/40">
                            {userItem.firstName[0]}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-white text-base">
                            {userItem.firstName} {userItem.lastName}
                          </h3>
                          <p className="text-xs text-slate-400">{userItem.email}</p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 capitalize">
                        {userItem.role === 'host' ? 'Property Host' : 'Room Seeker'}
                      </span>
                    </div>

                    {/* Document Thumbnails Preview Side-by-Side */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {/* Selfie Preview */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 block">User Selfie</span>
                        {userItem.selfieUrl ? (
                          <div
                            onClick={() => setInspectUser(userItem)}
                            className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer group hover:border-indigo-500/60 transition-all shadow-inner"
                          >
                            <img
                              src={userItem.selfieUrl}
                              alt="Selfie Document"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <Eye className="w-4 h-4" /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-xl border border-dashed border-slate-800 bg-slate-900/50 flex items-center justify-center text-xs text-slate-600">
                            No selfie uploaded
                          </div>
                        )}
                      </div>

                      {/* Government ID Card Preview */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 block">Government ID Card</span>
                        {userItem.idCardUrl ? (
                          <div
                            onClick={() => setInspectUser(userItem)}
                            className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer group hover:border-indigo-500/60 transition-all shadow-inner"
                          >
                            <img
                              src={userItem.idCardUrl}
                              alt="Government ID Card"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <Eye className="w-4 h-4" /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-xl border border-dashed border-slate-800 bg-slate-900/50 flex items-center justify-center text-xs text-slate-600">
                            No ID Card uploaded
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectUser(userItem)}
                        className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect Fullscreen
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectUser(userItem)}
                          disabled={submittingId === userItem.id}
                          className="border-red-900/50 text-red-400 hover:bg-red-950/40 hover:border-red-700 text-xs"
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleApprove(userItem.id)}
                          disabled={submittingId === userItem.id}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-300" />}
                        >
                          Approve & Room AI Verify
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Verification Queue Pagination Bar */}
              {totalVerificationPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
                  <span className="text-slate-400">
                    Showing{' '}
                    <strong className="text-slate-200">
                      {(verificationCurrentPage - 1) * verificationPageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-slate-200">
                      {Math.min(
                        verificationCurrentPage * verificationPageSize,
                        pendingUsers.length
                      )}
                    </strong>{' '}
                    of <strong className="text-slate-200">{pendingUsers.length}</strong> pending reviews
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={verificationCurrentPage === 1}
                      onClick={() => setVerificationCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs px-3"
                      leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                    >
                      Previous
                    </Button>

                    <span className="text-xs font-bold text-slate-300 px-2">
                      Page {verificationCurrentPage} of {totalVerificationPages}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={verificationCurrentPage >= totalVerificationPages}
                      onClick={() =>
                        setVerificationCurrentPage((prev) =>
                          Math.min(prev + 1, totalVerificationPages)
                        )
                      }
                      className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs px-3"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center border-slate-800 bg-slate-950/60 text-slate-400 space-y-3 rounded-2xl">
              <Sparkles className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-200">
                All pending room identity verification reviews are complete!
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No user selfie or ID documents are currently waiting for admin verification.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: USER DIRECTORY & MODERATION TABLE */}
      {activeTab === 'users' && (
        <div className="space-y-6" id="users">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <span>Seekers & Property Owners Directory ({filteredUsers.length})</span>
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl"
              />
            </div>
          </div>

          <Card className="border-slate-800 bg-slate-950/90 text-slate-100 shadow-xl overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">User</th>
                    <th className="px-6 py-3.5 font-bold">Role</th>
                    <th className="px-6 py-3.5 font-bold">Room AI Verification</th>
                    <th className="px-6 py-3.5 font-bold">Account Status</th>
                    <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center border border-slate-700">
                              {u.firstName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-200">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-[11px] text-slate-500 font-normal">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-300">
                          {u.isAdmin ? (
                            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                              Admin
                            </span>
                          ) : (
                            <span className="capitalize">{u.role === 'host' ? 'Property Host' : 'Room Seeker'}</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {u.identityVerified ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Room AI Verified
                            </span>
                          ) : u.identityStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                              <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Review
                            </span>
                          ) : u.identityStatus === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]" title={u.rejectionReason}>
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Not Submitted</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {u.isBlocked ? (
                            <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]">
                              <Ban className="w-3.5 h-3.5" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Active
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(u.selfieUrl || u.idCardUrl) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setInspectUser(u)}
                                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-[11px] h-7 px-2.5"
                              >
                                View ID Docs
                              </Button>
                            )}

                            {!u.isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                                disabled={submittingId === u.id}
                                className={`text-[11px] h-7 px-2.5 ${
                                  u.isBlocked
                                    ? 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/40'
                                    : 'border-red-900/60 text-red-400 hover:bg-red-950/40'
                                }`}
                              >
                                {u.isBlocked ? 'Unblock' : 'Block'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-xs">
                        No users found matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Pagination Controls Bar */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3.5 bg-slate-900/40 text-xs">
                <span className="text-slate-400">
                  Showing{' '}
                  <strong className="text-slate-200">
                    {(userCurrentPage - 1) * userPageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-200">
                    {Math.min(userCurrentPage * userPageSize, filteredUsers.length)}
                  </strong>{' '}
                  of <strong className="text-slate-200">{filteredUsers.length}</strong> users
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userCurrentPage === 1}
                    onClick={() => setUserCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs px-3"
                    leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                  >
                    Previous
                  </Button>

                  <span className="text-xs font-bold text-slate-300 px-2">
                    Page {userCurrentPage} of {totalUserPages}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userCurrentPage >= totalUserPages}
                    onClick={() =>
                      setUserCurrentPage((prev) => Math.min(prev + 1, totalUserPages))
                    }
                    className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs px-3"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* INSPECTION LIGHTBOX MODAL */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setInspectUser(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>Identity Documents Inspection</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  {inspectUser.firstName} {inspectUser.lastName} ({inspectUser.role === 'host' ? 'Property Host' : 'Room Seeker'})
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Inspect side-by-side user selfie and official government identification card
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Selfie Card */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">User Selfie Photo</span>
                {inspectUser.selfieUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square">
                    <img
                      src={inspectUser.selfieUrl}
                      alt="Selfie Full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl border border-dashed border-slate-800 bg-slate-900 flex items-center justify-center text-xs text-slate-600">
                    No selfie uploaded
                  </div>
                )}
              </div>

              {/* ID Card */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">Government ID Card Photo</span>
                {inspectUser.idCardUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square">
                    <img
                      src={inspectUser.idCardUrl}
                      alt="ID Card Full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl border border-dashed border-slate-800 bg-slate-900 flex items-center justify-center text-xs text-slate-600">
                    No ID Card uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setInspectUser(null)}
                className="border-slate-800 text-slate-400 hover:bg-slate-900 text-xs"
              >
                Close Inspection
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectUser(inspectUser);
                    setInspectUser(null);
                  }}
                  className="border-red-900/50 text-red-400 hover:bg-red-950/40 text-xs"
                >
                  Reject Documents
                </Button>

                <Button
                  onClick={() => handleApprove(inspectUser.id)}
                  disabled={submittingId === inspectUser.id}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-300" />}
                >
                  Approve & Room AI Verify
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-white">
              Reject Verification for {rejectUser.firstName}
            </h3>
            <p className="text-xs text-slate-400">
              Please enter the specific feedback/reason for rejecting this user's identity documents:
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="e.g. ID photo blurry, Selfie does not match ID card..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-slate-900 border-slate-800 text-slate-100 text-xs rounded-xl"
                required
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectUser(null)}
                  className="border-slate-800 text-slate-400 hover:bg-slate-900 text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={submittingId === rejectUser.id}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  Submit Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
