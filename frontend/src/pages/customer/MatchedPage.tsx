import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  MessageSquare,
  Calendar,
  MoreVertical,
  X,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInterest } from '@/hooks/useInterest';
import { toast } from '@/hooks/useToast';
import type { InterestDetail } from '@/types/interest.types';

export default function MatchedPage() {
  const { user } = useAuth();
  const {
    sentInterests,
    receivedInterests,
    processingId,
    acceptInterest,
    declineInterest,
  } = useInterest(user?.id);

  const [selectedMatch, setSelectedMatch] = useState<InterestDetail | null>(null);

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
                      onClick={() => declineInterest(item.id)}
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
          <div className="space-y-3">
            {mutualMatches.map((item) => {
              const otherUser = item.senderId === user?.id ? item.receiver : item.sender;
              const otherName = otherUser
                ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim()
                : 'Connected Flatmate';
              const occupation = otherUser?.occupation?.replace('_', ' ') || otherUser?.role || 'Roommate';

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col gap-3"
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
                      {otherUser?.email ? (
                        <a
                          href={`mailto:${otherUser.email}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Message</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedMatch(item)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Message</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toast.info('Visit scheduling calendar will be available shortly!')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                      >
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>Schedule Visit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMatch(item)}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
                        title="View details"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

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

                    {otherUser?.email && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500">Email:</span>
                        <a
                          href={`mailto:${otherUser.email}`}
                          className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {otherUser.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {otherUser?.email && (
                    <a
                      href={`mailto:${otherUser.email}`}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Contact via Email</span>
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
