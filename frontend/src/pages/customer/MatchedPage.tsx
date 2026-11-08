import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  MessageSquare,
  Calendar,
  MoreVertical,
  X,
  UserX,
  Clock,
  RotateCcw,
  Check,
  Sun,
  SunMedium,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInterest } from '@/hooks/useInterest';
import { useSocket } from '@/context/SocketContext';
import { visitService } from '@/services/visitService';
import { toast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import type { InterestDetail } from '@/types/interest.types';
import type { Visit, TimeSlot } from '@/types/visit.types';

export default function MatchedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const {
    sentInterests,
    receivedInterests,
    processingId,
    acceptInterest,
    declineInterest,
    cancelInterest,
    unmatch,
  } = useInterest(user?.id);

  const [selectedMatch, setSelectedMatch] = useState<InterestDetail | null>(null);
  const [unmatchTarget, setUnmatchTarget] = useState<{ id: string; name: string } | null>(null);

  // Visits state
  const [visits, setVisits] = useState<Visit[]>([]);
  const [rescheduleModalVisit, setRescheduleModalVisit] = useState<Visit | null>(null);
  const [manageScheduleVisit, setManageScheduleVisit] = useState<Visit | null>(null);
  const [isReschedulingMode, setIsReschedulingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [dismissedCancelledVisits, setDismissedCancelledVisits] = useState<Set<string>>(new Set());

  // Reschedule form state
  const [suggestDate, setSuggestDate] = useState('');
  const [suggestSlot, setSuggestSlot] = useState<TimeSlot>('afternoon');
  const [suggestMessage, setSuggestMessage] = useState('');
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

  // Load visits
  const loadUserVisits = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await visitService.getVisitsByUser(user.id);
      setVisits(res || []);
    } catch {
      // ignore
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserVisits();
  }, [loadUserVisits]);

  // Listen to socket visit events to refresh in real-time
  useEffect(() => {
    if (!socket) return;
    const handleVisitUpdate = () => {
      loadUserVisits();
    };
    socket.on('visit_update', handleVisitUpdate);
    return () => {
      socket.off('visit_update', handleVisitUpdate);
    };
  }, [socket, loadUserVisits]);

  // Map visits by connectionId (latest active visit, or latest update)
  const visitsByConnection = useMemo(() => {
    const map = new Map<string, Visit>();
    const sorted = [...visits].sort((a, b) => {
      const aActive = ['pending', 'rescheduled', 'confirmed'].includes(a.status);
      const bActive = ['pending', 'rescheduled', 'confirmed'].includes(b.status);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    sorted.forEach((v) => {
      if (!map.has(v.connectionId)) {
        map.set(v.connectionId, v);
      }
    });
    return map;
  }, [visits]);

  // Handle visit actions
  const handleAcceptVisit = async (visitId: string) => {
    if (!user?.id) return;
    try {
      await visitService.updateStatus(visitId, user.id, 'confirmed');
      toast.success('Visit confirmed! ✅');
      setManageScheduleVisit(null);
      loadUserVisits();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to accept visit');
    }
  };

  const handleRejectVisit = async (visitId: string, note?: string) => {
    if (!user?.id) return;
    try {
      await visitService.updateStatus(visitId, user.id, 'rejected', note);
      toast.info('Visit request declined.');
      setManageScheduleVisit(null);
      setShowRejectInput(false);
      setRejectReason('');
      loadUserVisits();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to decline visit');
    }
  };

  const handleCancelVisit = async (visitId: string) => {
    if (!user?.id) return;
    try {
      await visitService.updateStatus(visitId, user.id, 'cancelled');
      toast.info('Visit request cancelled.');
      setManageScheduleVisit(null);
      loadUserVisits();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to cancel visit');
    }
  };

  const handleAcceptSuggestion = async (visitId: string) => {
    if (!user?.id) return;
    try {
      await visitService.acceptSuggestion(visitId, user.id);
      toast.success('Rescheduled visit confirmed! 🎉');
      setManageScheduleVisit(null);
      loadUserVisits();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to accept reschedule');
    }
  };

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVisit = rescheduleModalVisit || manageScheduleVisit;
    if (!user?.id || !targetVisit) return;
    if (!suggestDate) {
      toast.error('Please pick a date.');
      return;
    }

    const slotTime =
      suggestSlot === 'morning' ? '10:00 AM' : suggestSlot === 'afternoon' ? '02:00 PM' : '06:00 PM';

    try {
      setSubmittingSuggestion(true);
      await visitService.suggestChanges(targetVisit.id, user.id, {
        suggestedDate: suggestDate,
        suggestedTimeSlot: suggestSlot,
        suggestedSlotTime: slotTime,
        suggestedMessage: suggestMessage.trim(),
      });
      toast.success('Reschedule proposal sent!');
      setRescheduleModalVisit(null);
      setManageScheduleVisit(null);
      setIsReschedulingMode(false);
      setSuggestMessage('');
      loadUserVisits();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to send proposed time');
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  // 1. Pending Received Interests
  const pendingReceived = useMemo(() => {
    return receivedInterests.filter((item) => item.status === 'pending');
  }, [receivedInterests]);

  // 2. Pending Sent Interests
  const pendingSent = useMemo(() => {
    return sentInterests.filter((item) => item.status === 'pending');
  }, [sentInterests]);

  // 3. Matched (Accepted Connections in either direction, deduplicated by the other user's ID)
  const mutualMatches = useMemo(() => {
    const acceptedList = [
      ...receivedInterests.filter((i) => i.status === 'accepted'),
      ...sentInterests.filter((i) => i.status === 'accepted'),
    ];

    const seenUserIds = new Set<string>();
    const deduplicated: InterestDetail[] = [];

    for (const item of acceptedList) {
      const otherUserId = item.senderId === user?.id ? item.receiverId : item.senderId;
      if (!seenUserIds.has(otherUserId)) {
        seenUserIds.add(otherUserId);
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }, [receivedInterests, sentInterests, user?.id]);

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <section className="space-y-1.5 border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Interests &amp; Matches
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Manage your active connections and track the status of interests you&apos;ve shared within
          the Kudai ecosystem.
        </p>
      </section>

      {/* Section 1: Received Interests */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">Received Interests</h2>
          <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-bold">
            {pendingReceived.length}
          </span>
        </div>

        {pendingReceived.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReceived.map((item) => {
              const sender = item.sender;
              const senderName = sender
                ? `${sender.firstName} ${sender.lastName || ''}`.trim()
                : 'Roommate Seeker';
              const occupation = sender?.occupation?.replace('_', ' ') || sender?.role || 'Seeker';

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Selfie Photo */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      {sender?.selfieUrl ? (
                        <img
                          src={sender.selfieUrl}
                          alt={senderName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white font-bold text-lg">
                          {senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1 truncate">
                          <span>{senderName}</span>
                          {sender?.identityVerified && (
                            <CheckCircle2 className="h-4 w-4 text-sky-500 fill-sky-500 text-white shrink-0" />
                          )}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          {occupation}
                        </span>
                      </div>

                      {/* Message or interest target note */}
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {item.message ||
                          `Interested in connecting with your ${item.targetType === 'room' ? 'room listing' : 'profile'}.`}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          Identity Verified
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          Compatible Match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accept / Reject Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => acceptInterest(item.id)}
                      className="flex-1 rounded-lg bg-black py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {processingId === item.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => declineInterest(item.id)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors disabled:opacity-50"
                    >
                      {processingId === item.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-xs text-slate-400">
            No pending received interests at the moment.
          </div>
        )}
      </section>

      {/* Section 2: Sent Interests */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">Sent Interests</h2>
          <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-bold">
            {pendingSent.length}
          </span>
        </div>

        {pendingSent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingSent.map((item) => {
              const receiver = item.receiver;
              const receiverName = receiver
                ? `${receiver.firstName} ${receiver.lastName || ''}`.trim()
                : 'Community Match';
              const occupation = receiver?.occupation?.replace('_', ' ') || receiver?.role || 'Host';

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Selfie / Target Photo */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      {receiver?.selfieUrl ? (
                        <img
                          src={receiver.selfieUrl}
                          alt={receiverName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white font-bold text-lg">
                          {receiverName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {receiverName}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          {occupation}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 italic">Waiting for response...</p>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          Sent for {item.targetType === 'room' ? 'Room Listing' : 'Profile'}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          Pending Review
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Interest Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => cancelInterest(item.id)}
                      className="w-full rounded-lg border border-rose-200 bg-white py-2 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                      {processingId === item.id ? 'Cancelling...' : 'Cancel Interest'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-xs text-slate-400">
            No pending sent interests. Explore profiles on the Discover page to connect.
          </div>
        )}
      </section>

      {/* Section 3: Matched (Mutual Accepted Connections) */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💎</span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Matched</h2>
          <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-bold">
            {mutualMatches.length}
          </span>
        </div>

        {mutualMatches.length > 0 ? (
          <div className="space-y-4">
            {mutualMatches.map((item) => {
              const otherUser = item.senderId === user?.id ? item.receiver : item.sender;
              const otherName = otherUser
                ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim()
                : 'Connected Flatmate';
              const occupation = otherUser?.occupation?.replace('_', ' ') || otherUser?.role || 'Roommate';

              const activeVisit = visitsByConnection.get(item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* User Info with Active Green Indicator */}
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        {otherUser?.selfieUrl ? (
                          <img
                            src={otherUser.selfieUrl}
                            alt={otherName}
                            className="h-12 w-12 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                            {otherName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                          <span>{otherName}</span>
                          {otherUser?.identityVerified && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium capitalize">
                          {occupation} • Matched connection
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (otherUser?.id) {
                            navigate(ROUTES.MESSAGES, {
                              state: { recipientId: otherUser.id, recipientName: otherName },
                            });
                          } else {
                            navigate(ROUTES.MESSAGES);
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Message</span>
                      </button>

                      {activeVisit && ['pending', 'rescheduled', 'confirmed'].includes(activeVisit.status) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setManageScheduleVisit(activeVisit);
                            setIsReschedulingMode(false);
                            setSuggestDate(activeVisit.suggestedDate || activeVisit.date);
                            setSuggestSlot(activeVisit.suggestedTimeSlot || activeVisit.timeSlot);
                            setSuggestMessage('');
                            setShowRejectInput(false);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5 text-white" />
                          <span>Manage Schedule</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            navigate(ROUTES.SCHEDULE_VISIT.replace(':connectionId', item.id), {
                              state: {
                                hostId: otherUser?.id,
                                hostName: otherName,
                                hostAvatar: otherUser?.selfieUrl,
                                isVerified: Boolean(otherUser?.identityVerified),
                                occupation,
                                roomId: item.targetType === 'room' ? item.targetId : undefined,
                              },
                            });
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>Schedule Visit</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setUnmatchTarget({ id: item.id, name: otherName })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
                        title="Unmatch connection"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Unmatch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMatch(item)}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                        title="View details"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visit Status Banner */}
                  {activeVisit && (
                    <div className="pt-1">
                      {/* 1. Pending Visit */}
                      {activeVisit.status === 'pending' && (
                        user?.id !== (activeVisit.createdBy || activeVisit.seekerId) ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-amber-700" />
                                  <span className="text-xs font-bold text-amber-950">
                                    Visit Requested by {otherName}: {activeVisit.date} at {activeVisit.slotTime} ({activeVisit.timeSlot})
                                  </span>
                                </div>
                                {activeVisit.message && (
                                  <p className="text-xs text-amber-800 italic pl-6">&ldquo;{activeVisit.message}&rdquo;</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptVisit(activeVisit.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-slate-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Accept Visit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRescheduleModalVisit(activeVisit);
                                    setSuggestDate(activeVisit.date);
                                    setSuggestSlot(activeVisit.timeSlot);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Suggest Changes</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelVisit(activeVisit.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Decline visit request"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-700" />
                                <span className="text-xs font-bold text-blue-950">
                                  Visit Requested: {activeVisit.date} at {activeVisit.slotTime} ({activeVisit.timeSlot})
                                </span>
                              </div>
                              <p className="text-xs text-blue-800 pl-6">
                                Waiting for {otherName} to confirm. You will be notified once accepted.
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCancelVisit(activeVisit.id)}
                                className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                              >
                                Cancel Request
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {/* 2. Rescheduled / Suggested Visit */}
                      {activeVisit.status === 'rescheduled' && (
                        user?.id !== (activeVisit.suggestedById || (activeVisit.suggestedBy === 'host' ? activeVisit.hostId : activeVisit.seekerId)) ? (
                          <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <RotateCcw className="h-4 w-4 text-purple-700" />
                                  <span className="text-xs font-bold text-purple-950">
                                    {otherName} Proposed New Time: {activeVisit.suggestedDate} at {activeVisit.suggestedSlotTime} ({activeVisit.suggestedTimeSlot})
                                  </span>
                                </div>
                                {activeVisit.suggestedMessage && (
                                  <p className="text-xs text-purple-800 italic pl-6">&ldquo;{activeVisit.suggestedMessage}&rdquo;</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptSuggestion(activeVisit.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-slate-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Accept Proposal</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRescheduleModalVisit(activeVisit);
                                    setSuggestDate(activeVisit.suggestedDate || activeVisit.date);
                                    setSuggestSlot(activeVisit.suggestedTimeSlot || activeVisit.timeSlot);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                >
                                  <span>Counter Propose</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-500" />
                              <span className="text-xs font-medium text-slate-700">
                                You proposed {activeVisit.suggestedDate} at {activeVisit.suggestedSlotTime} ({activeVisit.suggestedTimeSlot}) - Waiting for {otherName}&apos;s reply.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCancelVisit(activeVisit.id)}
                              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                            >
                              Cancel Visit
                            </button>
                          </div>
                        )
                      )}

                      {/* 3. Confirmed Visit */}
                      {activeVisit.status === 'confirmed' && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span className="text-xs font-bold text-emerald-950">
                                ✓ Confirmed Visit: {activeVisit.date} at {activeVisit.slotTime} ({activeVisit.timeSlot})
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800 pl-6">
                              Both parties have confirmed this visit. Message each other in-app to coordinate entry.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleModalVisit(activeVisit);
                                setSuggestDate(activeVisit.date);
                                setSuggestSlot(activeVisit.timeSlot);
                              }}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelVisit(activeVisit.id)}
                              className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 4. Cancelled Visit Alert Banner */}
                      {activeVisit.status === 'cancelled' && !dismissedCancelledVisits.has(activeVisit.id) && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <X className="h-4 w-4 text-rose-600" />
                              <span className="text-xs font-bold text-rose-950">
                                Visit Cancelled ❌
                              </span>
                            </div>
                            <p className="text-xs text-rose-700 pl-6">
                              The scheduled visit for {activeVisit.date} ({activeVisit.slotTime}) was cancelled.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigate(ROUTES.SCHEDULE_VISIT.replace(':connectionId', item.id), {
                                  state: {
                                    hostId: otherUser?.id,
                                    hostName: otherName,
                                    hostAvatar: otherUser?.selfieUrl,
                                    isVerified: Boolean(otherUser?.identityVerified),
                                    occupation,
                                    roomId: item.targetType === 'room' ? item.targetId : undefined,
                                  },
                                });
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-black text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Schedule New Visit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDismissedCancelledVisits((prev) => new Set(prev).add(activeVisit.id))
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                              title="Dismiss notice"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 5. Declined Visit Alert Banner */}
                      {activeVisit.status === 'rejected' && !dismissedCancelledVisits.has(activeVisit.id) && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <X className="h-4 w-4 text-rose-600" />
                              <span className="text-xs font-bold text-rose-950">
                                Visit Request Declined ❌
                              </span>
                            </div>
                            <p className="text-xs text-rose-700 pl-6">
                              The visit request for {activeVisit.date} ({activeVisit.slotTime}) was declined.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigate(ROUTES.SCHEDULE_VISIT.replace(':connectionId', item.id), {
                                  state: {
                                    hostId: otherUser?.id,
                                    hostName: otherName,
                                    hostAvatar: otherUser?.selfieUrl,
                                    isVerified: Boolean(otherUser?.identityVerified),
                                    occupation,
                                    roomId: item.targetType === 'room' ? item.targetId : undefined,
                                  },
                                });
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-black text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Schedule Again
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDismissedCancelledVisits((prev) => new Set(prev).add(activeVisit.id))
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                              title="Dismiss notice"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        toast.success('Rental agreement setup will be available in the next release!')
                      }
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      Proceed with Agreement &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-xs text-slate-400">
            No mutual matches yet. When someone accepts your interest or you accept theirs, they will
            appear here as a verified Matched roommate.
          </div>
        )}
      </section>

      {/* Matched Details Inspection Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl relative">
            <button
              type="button"
              onClick={() => setSelectedMatch(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const otherUser =
                selectedMatch.senderId === user?.id
                  ? selectedMatch.receiver
                  : selectedMatch.sender;
              const otherName = otherUser
                ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim()
                : 'Flatmate';

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {otherUser?.selfieUrl ? (
                      <img
                        src={otherUser.selfieUrl}
                        alt={otherName}
                        className="h-14 w-14 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-lg">
                        {otherName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                        <span>{otherName}</span>
                        {otherUser?.identityVerified && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 capitalize">
                        {otherUser?.occupation?.replace('_', ' ') || otherUser?.role || 'Roommate'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Connection Status:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                        MUTUALLY MATCHED
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">In-App Chat:</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Active &amp; Connected
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMatch(null);
                      if (otherUser?.id) {
                        navigate(ROUTES.MESSAGES, {
                          state: { recipientId: otherUser.id, recipientName: otherName },
                        });
                      } else {
                        navigate(ROUTES.MESSAGES);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Open Messages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUnmatchTarget({ id: selectedMatch.id, name: otherName });
                      setSelectedMatch(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-100 transition-colors"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span>Unmatch / Remove Connection</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Unmatch Confirmation Modal */}
      {unmatchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Unmatch with {unmatchTarget.name}?
                </h3>
                <p className="text-xs text-slate-400">This action will disconnect both accounts.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this connection? Both of you will no longer appear in
              each other&apos;s matched lists.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUnmatchTarget(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Keep Connection
              </button>
              <button
                type="button"
                disabled={processingId === unmatchTarget.id}
                onClick={async () => {
                  await unmatch(unmatchTarget.id, unmatchTarget.name);
                  setUnmatchTarget(null);
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {processingId === unmatchTarget.id ? 'Unmatching...' : 'Yes, Unmatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Changes / Reschedule Modal */}
      {rescheduleModalVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setRescheduleModalVisit(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-slate-700" /> Propose New Visit Time
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select an alternative date and time slot that fits your schedule better.
              </p>
            </div>

            <form onSubmit={handleSendSuggestion} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Proposed Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={suggestDate}
                  onChange={(e) => setSuggestDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Proposed Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'Morning', time: '10:00 AM', icon: Sun },
                    { id: 'afternoon', label: 'Afternoon', time: '02:00 PM', icon: SunMedium },
                    { id: 'evening', label: 'Evening', time: '06:00 PM', icon: Moon },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = suggestSlot === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSuggestSlot(s.id as TimeSlot)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 border-black bg-white shadow-xs font-bold text-black'
                            : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 mx-auto mb-1 text-slate-700" />
                        <span className="text-xs block">{s.label}</span>
                        <span className="text-[10px] text-slate-400 block">{s.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Note / Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={suggestMessage}
                  onChange={(e) => setSuggestMessage(e.target.value)}
                  placeholder="e.g., I have office meetings until 5 PM, evening works better for me..."
                  maxLength={500}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalVisit(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSuggestion || !suggestDate}
                  className="flex-1 rounded-xl bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingSuggestion ? 'Sending...' : 'Send Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Schedule Modal */}
      {manageScheduleVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setManageScheduleVisit(null);
                setIsReschedulingMode(false);
                setShowRejectInput(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900">Manage Visit Schedule</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                View request details, accept, reject, or postpone/prepone the scheduled visit.
              </p>
            </div>

            {/* Visit Details Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    manageScheduleVisit.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : manageScheduleVisit.status === 'rescheduled'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {manageScheduleVisit.status === 'confirmed'
                    ? 'Confirmed Visit'
                    : manageScheduleVisit.status === 'rescheduled'
                    ? 'Reschedule In Discussion'
                    : 'Pending Confirmation'}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                <span className="font-semibold text-slate-500">Scheduled Date</span>
                <span className="font-bold text-slate-900">{manageScheduleVisit.date}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                <span className="font-semibold text-slate-500">Time Slot</span>
                <span className="font-bold text-slate-900 capitalize">
                  {manageScheduleVisit.slotTime} ({manageScheduleVisit.timeSlot})
                </span>
              </div>

              {manageScheduleVisit.message && (
                <div className="border-t border-slate-200/60 pt-2.5">
                  <span className="font-semibold text-slate-500 block mb-1">Attached Message</span>
                  <p className="italic text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                    &ldquo;{manageScheduleVisit.message}&rdquo;
                  </p>
                </div>
              )}

              {/* Proposed Reschedule Info if any */}
              {manageScheduleVisit.suggestedDate && (
                <div className="border-t border-purple-200 bg-purple-50/80 -mx-4 -mb-4 p-4 rounded-b-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold text-[11px] uppercase tracking-wider">
                    <RotateCcw className="h-3.5 w-3.5 text-purple-700" />
                    Proposed Alternative Time
                  </div>
                  <p className="text-slate-800 font-medium">
                    {manageScheduleVisit.suggestedDate} at {manageScheduleVisit.suggestedSlotTime} (
                    {manageScheduleVisit.suggestedTimeSlot})
                  </p>
                  {manageScheduleVisit.suggestedMessage && (
                    <p className="text-purple-950 italic text-[11px]">
                      &ldquo;{manageScheduleVisit.suggestedMessage}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* If Rescheduling (Postpone / Prepone) Form is Active */}
            {isReschedulingMode ? (
              <form onSubmit={handleSendSuggestion} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5 text-slate-700" />
                    Postpone or Prepone Visit
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReschedulingMode(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    New Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={suggestDate}
                    onChange={(e) => setSuggestDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    New Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'morning', label: 'Morning', time: '10:00 AM', icon: Sun },
                      { id: 'afternoon', label: 'Afternoon', time: '02:00 PM', icon: SunMedium },
                      { id: 'evening', label: 'Evening', time: '06:00 PM', icon: Moon },
                    ].map((s) => {
                      const Icon = s.icon;
                      const isSelected = suggestSlot === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSuggestSlot(s.id as TimeSlot)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-black bg-white shadow-xs font-bold text-black'
                              : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <Icon className="h-4 w-4 mx-auto mb-1 text-slate-700" />
                          <span className="text-xs block">{s.label}</span>
                          <span className="text-[10px] text-slate-400 block">{s.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Attach Message / Reason
                  </label>
                  <textarea
                    rows={3}
                    value={suggestMessage}
                    onChange={(e) => setSuggestMessage(e.target.value)}
                    placeholder="Explain why you want to postpone or prepone (e.g. shift conflict, weekend availability)..."
                    maxLength={500}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsReschedulingMode(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSuggestion || !suggestDate}
                    className="flex-1 rounded-xl bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submittingSuggestion ? 'Sending...' : 'Send Reschedule'}
                  </button>
                </div>
              </form>
            ) : showRejectInput ? (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-rose-600 block">Decline Visit Request</span>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Optional reason for declining (e.g. room already occupied, schedule incompatible)..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectVisit(manageScheduleVisit.id, rejectReason)}
                    className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Confirm Decline
                  </button>
                </div>
              </div>
            ) : (
              /* Main Action Buttons */
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {/* 1. If visit is in suggestion state and user is the recipient of the suggestion */}
                {manageScheduleVisit.status === 'rescheduled' &&
                user?.id !== (manageScheduleVisit.suggestedById || (manageScheduleVisit.suggestedBy === 'host' ? manageScheduleVisit.hostId : manageScheduleVisit.seekerId)) ? (
                  <button
                    type="button"
                    onClick={() => handleAcceptSuggestion(manageScheduleVisit.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    <span>Accept Proposed Reschedule</span>
                  </button>
                ) : null}

                {/* 2. If visit is pending and user is the recipient (NOT the creator) */}
                {manageScheduleVisit.status === 'pending' &&
                user?.id !== (manageScheduleVisit.createdBy || manageScheduleVisit.seekerId) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAcceptVisit(manageScheduleVisit.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                    >
                      <Check className="h-4 w-4" />
                      <span>Accept Schedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsReschedulingMode(true);
                        setSuggestDate(manageScheduleVisit.suggestedDate || manageScheduleVisit.date);
                        setSuggestSlot(manageScheduleVisit.suggestedTimeSlot || manageScheduleVisit.timeSlot);
                        setSuggestMessage('');
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="h-4 w-4 text-slate-500" />
                      <span>Postpone or Prepone (Reschedule)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRejectInput(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject / Decline Visit</span>
                    </button>
                  </>
                ) : null}

                {/* 3. If visit is pending and user IS the creator/requester */}
                {manageScheduleVisit.status === 'pending' &&
                user?.id === (manageScheduleVisit.createdBy || manageScheduleVisit.seekerId) && (
                  <div className="space-y-3">
                    <p className="text-xs text-blue-900 bg-blue-50 border border-blue-200 p-3 rounded-xl">
                      You requested this visit. Waiting for the other party to confirm or propose changes.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCancelVisit(manageScheduleVisit.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel Visit Request</span>
                    </button>
                  </div>
                )}

                {/* 4. If visit is confirmed */}
                {manageScheduleVisit.status === 'confirmed' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsReschedulingMode(true);
                        setSuggestDate(manageScheduleVisit.date);
                        setSuggestSlot(manageScheduleVisit.timeSlot);
                        setSuggestMessage('');
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="h-4 w-4 text-slate-500" />
                      <span>Reschedule Visit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelVisit(manageScheduleVisit.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel Confirmed Visit</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
