import { useCallback, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  UserCircle,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Home,
  UserCheck,
  MapPin,
  Heart,
  SlidersHorizontal,
  Eye,
  X,
  Building2,
  Check,
  User,
  Users,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useInterest } from '@/hooks/useInterest';
import { ROUTES } from '@/constants/routes';
import { onboardingService } from '@/services/onboardingService';
import type { RoomEntity, SeekerPreferenceEntity } from '@/types/onboarding.types';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.firstName;

  const isOnboarded = Boolean(user?.isOnboarded);
  const role = (user?.role as 'host' | 'seeker' | 'none') || 'none';

  const [rooms, setRooms] = useState<RoomEntity[]>([]);
  const [seekers, setSeekers] = useState<SeekerPreferenceEntity[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Connection & Interest Hook (Send, Accept, Decline)
  const {
    sentInterests,
    receivedInterests,
    processingId,
    sendInterest,
    acceptInterest,
    declineInterest,
    getInterestStatus,
  } = useInterest(user?.id);

  const [interestTab, setInterestTab] = useState<'received' | 'sent'>('received');

  // Listing Inspection Modal State
  const [selectedRoom, setSelectedRoom] = useState<RoomEntity | null>(null);
  const [selectedSeeker, setSelectedSeeker] = useState<SeekerPreferenceEntity | null>(null);

  // Fetch real rooms / seeker profiles when onboarded
  useEffect(() => {
    if (!isOnboarded || !user?.id) return;

    let isMounted = true;
    setLoadingMatches(true);

    if (role === 'seeker') {
      onboardingService
        .getRooms({ userId: user.id })
        .then((res) => {
          if (isMounted) {
            setRooms(res || []);
            setLoadingMatches(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setRooms([]);
            setLoadingMatches(false);
          }
        });
    } else if (role === 'host') {
      onboardingService
        .getSeekerPreferences(user.id)
        .then((res) => {
          if (isMounted) {
            setSeekers(res || []);
            setLoadingMatches(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setSeekers([]);
            setLoadingMatches(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOnboarded, role, user?.id]);

  const connectedCount = useMemo(() => {
    return (
      sentInterests.filter((i) => i.status === 'accepted').length +
      receivedInterests.filter((i) => i.status === 'accepted').length
    );
  }, [sentInterests, receivedInterests]);

  const pendingReceivedCount = useMemo(() => {
    return receivedInterests.filter((i) => i.status === 'pending').length;
  }, [receivedInterests]);

  const dashboardStats = useMemo(() => {
    const matchCount = role === 'seeker' ? rooms.length : seekers.length;
    return [
      {
        id: 'matches',
        label: 'New Matches',
        value: String(matchCount),
        change: '+4 this week',
        icon: Users,
      },
      {
        id: 'connections',
        label: 'Connected Roommates',
        value: String(connectedCount),
        change: connectedCount > 0 ? `${connectedCount} active connection(s)` : 'Send interest to connect',
        icon: UserCheck,
      },
      {
        id: 'requests',
        label: 'Pending Requests',
        value: String(pendingReceivedCount),
        change: pendingReceivedCount > 0 ? `${pendingReceivedCount} awaiting your reply` : 'All caught up',
        icon: Clock,
      },
      {
        id: 'sent',
        label: 'Sent Interests',
        value: String(sentInterests.length),
        change: `${sentInterests.filter((i) => i.status === 'pending').length} pending reply`,
        icon: Heart,
      },
    ];
  }, [role, rooms.length, seekers.length, connectedCount, pendingReceivedCount, sentInterests]);

  const dashboardActivities = useMemo(() => {
    return [
      {
        id: 'a1',
        text: 'System verified active matches updated for your profile.',
        time: '5 min ago',
      },
      {
        id: 'a2',
        text: role === 'seeker'
          ? 'New host listings available in your preferred location.'
          : 'New room seekers available matching your property.',
        time: '1 hour ago',
      },
      {
        id: 'a3',
        text: 'Identity verification badge active for displayed profiles.',
        time: 'Today',
      },
    ];
  }, [role]);

  const handleSendInterest = useCallback(
    async (targetId: string, recipientName: string, recipientUserId?: string) => {
      if (!user?.id || !recipientUserId) return;
      await sendInterest(
        {
          senderId: user.id,
          receiverId: recipientUserId,
          targetType: role === 'seeker' ? 'room' : 'seeker',
          targetId: targetId,
        },
        recipientName
      );
    },
    [user?.id, role, sendInterest]
  );

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-6 text-white sm:p-8 shadow-xl">
        <div aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {!isOnboarded
              ? "Action Required: Onboarding Incomplete"
              : role === 'host'
              ? "Host Profile Active"
              : "Seeker Profile Active"}
          </div>

          <h1 className="text-2xl font-extrabold sm:text-3xl tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ''} 👋
          </h1>

          <p className="mt-2 text-emerald-50 text-sm sm:text-base leading-relaxed">
            {!isOnboarded
              ? "Complete your Personal Profile, Lifestyle Preferences, Identity Verification, and Role Setup to unlock room & roommate matches."
              : role === 'host'
              ? "You are logged in as a Host. Browse matching seekers, review their lifestyles, and send interest requests."
              : "You are logged in as a Seeker. Browse available room listings, view property & host details, and send interest requests."}
          </p>

          {!isOnboarded && (
            <Button
              variant="secondary"
              className="mt-5 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-md border-none"
              leftIcon={<UserCircle className="h-4 w-4 text-emerald-600" />}
              onClick={() => navigate(ROUTES.ONBOARDING_PROFILE)}
            >
              Complete Setup Now
            </Button>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </section>

      {/* Conditional Dashboard Views */}
      {!isOnboarded ? (
        <section aria-labelledby="onboarding-notice" className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-800">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 id="onboarding-notice" className="text-lg font-bold text-amber-950">
                Unlock Roommate Matches & Property Details
              </h2>
              <p className="mt-1 text-sm text-amber-800/90 leading-relaxed max-w-2xl">
                Your suggested matches, recent activity, and property search are hidden until your Personal Profile, Lifestyle, ID Verification, and Role Setup are completed.
              </p>
              <div className="mt-4">
                <Button
                  size="md"
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm font-semibold"
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => navigate(ROUTES.ONBOARDING_PROFILE)}
                >
                  Start Onboarding Setup
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Matches Column */}
          <section aria-labelledby="matches-heading" className="space-y-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="matches-heading" className="text-xl font-bold text-slate-900">
                  {role === 'seeker' ? 'Available Verified Room Listings' : 'Matching Verified Roommate Seekers'}
                </h2>
                <p className="text-xs text-slate-500">
                  {role === 'seeker'
                    ? 'Explore properties matching your location, budget, amenities & lifestyle compatibility'
                    : 'Profiles looking for rooms matching your property'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
                  Filter & Sort
                </Button>
              </div>
            </div>

            {loadingMatches ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading matches...</div>
            ) : role === 'seeker' ? (
              /* SEEKER VIEW: List of Rooms */
              rooms.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rooms.map((room) => {
                    const hostUserId = room.hostId || room.host?.id || room.userId;
                    const interestStatus = getInterestStatus(room.id, hostUserId);
                    const matchPercent = room.matchPercentage ?? 85;
                    const hostName = room.host ? `${room.host.firstName} ${room.host.lastName || ''}`.trim() : 'Property Host';

                    return (
                      <Card key={room.id} className="overflow-hidden border border-slate-200 p-0 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                          <div
                            className="relative h-44 bg-slate-100 cursor-pointer group"
                            onClick={() => setSelectedRoom(room)}
                          >
                            {room.images && room.images.length > 0 ? (
                              <img src={room.images[0]} alt={room.title || room.roomType} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                            ) : room.host?.selfieUrl ? (
                              <img src={room.host.selfieUrl} alt={hostName} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <Home className="h-10 w-10" />
                              </div>
                            )}
                            <span className="absolute top-3 left-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              {matchPercent}% Match
                            </span>

                            {room.host?.identityVerified && (
                              <span className="absolute top-3 right-3 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold shadow flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Host
                              </span>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <Eye className="w-4 h-4" /> View Details & Host Profile
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedRoom(room)}>
                              <div>
                                <h3 className="font-bold text-slate-900 text-base capitalize">
                                  {room.title || room.roomType.replace('_', ' ')}
                                </h3>
                                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                  {room.location}
                                </p>
                              </div>
                              <p className="text-emerald-700 font-extrabold text-lg">
                                ₹{room.monthlyRent}
                                <span className="text-[10px] font-normal text-slate-500">/mo</span>
                              </p>
                            </div>

                            {room.description && (
                              <p className="text-xs text-slate-600 line-clamp-2">{room.description}</p>
                            )}

                            {/* Host Summary Snippet with Photo */}
                            <div className="rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100 flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Host:</span>
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                {room.host?.selfieUrl ? (
                                  <img src={room.host.selfieUrl} alt={hostName} className="w-4 h-4 rounded-full object-cover border border-emerald-500" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                                {hostName}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
                              leftIcon={<Eye className="h-3.5 w-3.5" />}
                              onClick={() => setSelectedRoom(room)}
                            >
                              Details
                            </Button>

                            {interestStatus === 'accepted' ? (
                              <Button
                                size="sm"
                                disabled
                                className="text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
                                leftIcon={<Check className="h-3.5 w-3.5 text-emerald-600" />}
                              >
                                Connected 🎉
                              </Button>
                            ) : interestStatus === 'pending' ? (
                              <Button
                                size="sm"
                                disabled
                                className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300"
                                leftIcon={<Clock className="h-3.5 w-3.5 text-amber-600" />}
                              >
                                Pending ⏳
                              </Button>
                            ) : interestStatus === 'received_pending' ? (
                              <Button
                                size="sm"
                                onClick={() => setInterestTab('received')}
                                className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100"
                                leftIcon={<Heart className="h-3.5 w-3.5 text-blue-600" />}
                              >
                                Respond in Requests
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={processingId === room.id}
                                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                leftIcon={<Heart className="h-3.5 w-3.5" />}
                                onClick={() => handleSendInterest(room.id, hostName, hostUserId)}
                              >
                                {processingId === room.id ? 'Sending...' : 'Send Interest'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Empty Room Matches State */
                <Card className="p-8 text-center border border-dashed border-slate-300 rounded-3xl bg-slate-50/50 space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Home className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">No Room Listings Available</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    There are currently no room listings available. Once hosts publish property listings, they will appear here.
                  </p>
                </Card>
              )
            ) : (
              /* HOST VIEW: List of Seekers */
              seekers.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {seekers.map((seeker) => {
                    const seekerUserId = seeker.userId || seeker.seeker?.id;
                    const interestStatus = getInterestStatus(seeker.id, seekerUserId);
                    const matchPercent = seeker.matchPercentage ?? 85;
                    const seekerName = seeker.seeker ? `${seeker.seeker.firstName} ${seeker.seeker.lastName || ''}`.trim() : 'Room Seeker';

                    return (
                      <Card key={seeker.id} className="overflow-hidden border border-slate-200 p-0 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                          {/* Seeker Main Image Header */}
                          <div
                            className="relative h-44 bg-slate-100 cursor-pointer group overflow-hidden"
                            onClick={() => setSelectedSeeker(seeker)}
                          >
                            {seeker.seeker?.selfieUrl ? (
                              <img
                                src={seeker.seeker.selfieUrl}
                                alt={seekerName}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-4">
                                <div className="h-16 w-16 rounded-full bg-white/20 text-white font-extrabold text-2xl flex items-center justify-center mb-1">
                                  {seekerName ? seekerName[0].toUpperCase() : 'S'}
                                </div>
                                <span className="text-xs font-semibold">{seekerName}</span>
                              </div>
                            )}

                            <span className="absolute top-3 left-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              {matchPercent}% Match
                            </span>

                            {seeker.seeker?.identityVerified && (
                              <span className="absolute top-3 right-3 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold shadow flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Seeker
                              </span>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <Eye className="w-4 h-4" /> View Details & Seeker Profile
                            </div>
                          </div>

                          {/* Seeker Card Details */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedSeeker(seeker)}>
                              {seeker.seeker?.selfieUrl ? (
                                <img
                                  src={seeker.seeker.selfieUrl}
                                  alt={seekerName}
                                  className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500 shrink-0 shadow-sm"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                                  {seekerName ? seekerName[0].toUpperCase() : 'S'}
                                </div>
                              )}
                              <div>
                                <h3 className="font-bold text-slate-900 text-base">{seekerName}</h3>
                                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                  {seeker.preferredLocation}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-2.5 text-xs space-y-1.5 border border-slate-100">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Max Budget:</span>
                                <span className="font-extrabold text-emerald-700">₹{seeker.maxBudget}/mo</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Room Pref:</span>
                                <span className="font-semibold text-slate-800 capitalize">
                                  {seeker.roomTypePreference.replace('_', ' ')}
                                </span>
                              </div>
                              {seeker.seeker?.occupation && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Occupation:</span>
                                  <span className="font-semibold text-slate-800 capitalize">
                                    {seeker.seeker.occupation.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {seeker.seeker?.bio && (
                              <p className="text-xs text-slate-600 italic line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                &quot;{seeker.seeker.bio}&quot;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
                              leftIcon={<Eye className="h-3.5 w-3.5" />}
                              onClick={() => setSelectedSeeker(seeker)}
                            >
                              Details
                            </Button>

                            {interestStatus === 'accepted' ? (
                              <Button
                                size="sm"
                                disabled
                                className="text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
                                leftIcon={<Check className="h-3.5 w-3.5 text-emerald-600" />}
                              >
                                Connected 🎉
                              </Button>
                            ) : interestStatus === 'pending' ? (
                              <Button
                                size="sm"
                                disabled
                                className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300"
                                leftIcon={<Clock className="h-3.5 w-3.5 text-amber-600" />}
                              >
                                Pending ⏳
                              </Button>
                            ) : interestStatus === 'received_pending' ? (
                              <Button
                                size="sm"
                                onClick={() => setInterestTab('received')}
                                className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100"
                                leftIcon={<Heart className="h-3.5 w-3.5 text-blue-600" />}
                              >
                                Respond in Requests
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={processingId === seeker.id}
                                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                leftIcon={<Heart className="h-3.5 w-3.5" />}
                                onClick={() => handleSendInterest(seeker.id, seekerName, seekerUserId)}
                              >
                                {processingId === seeker.id ? 'Sending...' : 'Send Interest'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Empty Seeker Matches State */
                <Card className="p-8 text-center border border-dashed border-slate-300 rounded-3xl bg-slate-50/50 space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">No Verified Room Seekers Available</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    There are currently no room seekers verified by Admin. Once seekers complete their profile and get approved by Admin, their profiles will appear here.
                  </p>
                </Card>
              )
            )}
          </section>

          {/* Right Column: Connection Requests & Activity */}
          <section className="space-y-6">
            {/* Connection Requests Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500" /> Connection Requests
                </h2>
                {pendingReceivedCount > 0 && (
                  <span className="rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-bold">
                    {pendingReceivedCount} New
                  </span>
                )}
              </div>

              <Card className="p-4 border border-slate-200 shadow-sm space-y-4">
                {/* Tabs */}
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setInterestTab('received')}
                    className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                      interestTab === 'received'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Received ({receivedInterests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestTab('sent')}
                    className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                      interestTab === 'sent'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sent ({sentInterests.length})
                  </button>
                </div>

                {/* Tab Content */}
                {interestTab === 'received' ? (
                  receivedInterests.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No incoming interest requests yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {receivedInterests.map((item) => {
                        const senderName = item.sender
                          ? `${item.sender.firstName} ${item.sender.lastName || ''}`.trim()
                          : 'A User';
                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {item.sender?.selfieUrl ? (
                                  <img
                                    src={item.sender.selfieUrl}
                                    alt={senderName}
                                    className="h-8 w-8 rounded-full object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                                    {senderName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900">{senderName}</p>
                                  <p className="text-[10px] text-slate-400 capitalize">
                                    {item.sender?.role || 'User'} • Interested in your{' '}
                                    {item.targetType === 'room' ? 'Room' : 'Profile'}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'accepted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'declined'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Actions for Pending */}
                            {item.status === 'pending' && (
                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  size="sm"
                                  disabled={processingId === item.id}
                                  onClick={() => acceptInterest(item.id)}
                                  className="flex-1 text-[11px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                  leftIcon={<Check className="h-3 w-3" />}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={processingId === item.id}
                                  onClick={() => declineInterest(item.id)}
                                  className="flex-1 text-[11px] h-7 border-slate-300 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                  leftIcon={<X className="h-3 w-3" />}
                                >
                                  Decline
                                </Button>
                              </div>
                            )}

                            {/* Connected View */}
                            {item.status === 'accepted' && item.sender?.email && (
                              <a
                                href={`mailto:${item.sender.email}`}
                                className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold hover:underline pt-1"
                              >
                                <Mail className="h-3 w-3" /> Connect: {item.sender.email}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : sentInterests.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    You haven't sent any interest requests yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {sentInterests.map((item) => {
                      const receiverName = item.receiver
                        ? `${item.receiver.firstName} ${item.receiver.lastName || ''}`.trim()
                        : 'Property / Roommate';
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{receiverName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'declined'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Sent for {item.targetType === 'room' ? 'Room Listing' : 'Roommate Profile'}
                          </p>
                          {item.status === 'accepted' && item.receiver?.email && (
                            <a
                              href={`mailto:${item.receiver.email}`}
                              className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold hover:underline pt-0.5"
                            >
                              <Mail className="h-3 w-3" /> Email: {item.receiver.email}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Recent Activity Card */}
            <div className="space-y-3">
              <h2 id="activity-heading" className="text-lg font-bold text-slate-900">
                Recent Activity
              </h2>
              <Card className="divide-y divide-slate-100 p-0 border border-slate-200 shadow-sm">
                {dashboardActivities.map((item) => (
                  <div key={item.id} className="flex gap-3 p-4">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.text}</p>
                      <p className="mt-0.5 text-xs text-slate-400 font-semibold">{item.time}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </section>
        </div>
      )}

      {/* ROOM LISTING FULL INSPECTION MODAL (WITH HOST PROFILE & LIFESTYLE) */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedRoom(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 capitalize">
                    {selectedRoom.title || selectedRoom.roomType.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {selectedRoom.location}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {selectedRoom.matchPercentage ?? 85}% Match
              </span>
            </div>

            {/* Photo Gallery */}
            {selectedRoom.images && selectedRoom.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto rounded-2xl p-1 bg-slate-50 border border-slate-100">
                {selectedRoom.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Room photo ${idx + 1}`}
                    className="rounded-xl h-36 w-full object-cover border border-slate-200"
                  />
                ))}
              </div>
            ) : (
              <div className="h-36 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                No images available for this room
              </div>
            )}

            {/* Room Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-medium">Monthly Rent</span>
                <p className="font-extrabold text-emerald-700 text-lg">₹{selectedRoom.monthlyRent} / month</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Capacity</span>
                <p className="font-bold text-slate-800 text-sm">{selectedRoom.capacity} Person(s)</p>
              </div>

              {selectedRoom.availabilityNotes && (
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-medium">Visit & Availability Notes</span>
                  <p className="text-slate-700 mt-0.5">{selectedRoom.availabilityNotes}</p>
                </div>
              )}
            </div>

            {/* Amenities List */}
            {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Room Amenities Included</span>
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {amenity.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* HOST PROFILE DETAILS BOX */}
            {selectedRoom.host && (
              <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedRoom.host.selfieUrl ? (
                      <img
                        src={selectedRoom.host.selfieUrl}
                        alt="Host Profile"
                        className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500 shadow"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center">
                        {selectedRoom.host.firstName[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>Property Host: {selectedRoom.host.firstName} {selectedRoom.host.lastName || ''}</span>
                      </h4>
                      <p className="text-slate-500 text-[11px]">{selectedRoom.host.email}</p>
                    </div>
                  </div>

                  {selectedRoom.host.identityVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Admin Verified Host
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/40">
                  {selectedRoom.host.occupation && (
                    <p><span className="text-slate-500">Occupation:</span> <strong>{selectedRoom.host.occupation}</strong></p>
                  )}
                  {selectedRoom.host.gender && (
                    <p><span className="text-slate-500">Gender:</span> <strong className="capitalize">{selectedRoom.host.gender}</strong></p>
                  )}
                </div>

                {selectedRoom.host.bio && (
                  <p className="text-slate-600 italic text-[11px] bg-white p-2.5 rounded-xl border border-emerald-100">
                    &quot;{selectedRoom.host.bio}&quot;
                  </p>
                )}

                {/* Host Lifestyle Habits */}
                {selectedRoom.host.lifestyle && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Host Lifestyle Habits</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Smoking: <strong className="capitalize">{selectedRoom.host.lifestyle.smoking}</strong>
                      </span>
                      <span className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Drinking: <strong className="capitalize">{selectedRoom.host.lifestyle.drinking}</strong>
                      </span>
                      <span className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Cleanliness: <strong className="capitalize">{selectedRoom.host.lifestyle.cleanliness.replace('_', ' ')}</strong>
                      </span>
                      <span className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Visitors: <strong className="capitalize">{selectedRoom.host.lifestyle.visitorPolicy}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {selectedRoom.description && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Property Description</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedRoom.description}
                </p>
              </div>
            )}

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setSelectedRoom(null)}
                className="text-xs text-slate-600 border-slate-300"
              >
                Close Details
              </Button>

              {(() => {
                const hostUserId = selectedRoom.hostId || selectedRoom.host?.id || selectedRoom.userId;
                const status = getInterestStatus(selectedRoom.id, hostUserId);

                if (status === 'accepted') {
                  return (
                    <Button
                      size="sm"
                      disabled
                      className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold"
                      leftIcon={<Check className="w-4 h-4 text-emerald-600" />}
                    >
                      Connected 🎉
                    </Button>
                  );
                }
                if (status === 'pending') {
                  return (
                    <Button
                      size="sm"
                      disabled
                      className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                      leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
                    >
                      Request Pending ⏳
                    </Button>
                  );
                }
                if (status === 'received_pending') {
                  return (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRoom(null);
                        setInterestTab('received');
                      }}
                      className="bg-blue-50 text-blue-800 border border-blue-300 font-semibold hover:bg-blue-100"
                      leftIcon={<Heart className="w-4 h-4 text-blue-600" />}
                    >
                      Respond in Requests
                    </Button>
                  );
                }
                return (
                  <Button
                    disabled={processingId === selectedRoom.id}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    leftIcon={<Heart className="w-4 h-4" />}
                    onClick={() => {
                      const hostName = selectedRoom.host ? `${selectedRoom.host.firstName} ${selectedRoom.host.lastName || ''}`.trim() : selectedRoom.location;
                      handleSendInterest(selectedRoom.id, hostName, hostUserId);
                      setSelectedRoom(null);
                    }}
                  >
                    {processingId === selectedRoom.id ? 'Sending...' : 'Send Interest & Request Room'}
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SEEKER FULL INSPECTION MODAL (WITH SEEKER PROFILE & LIFESTYLE) */}
      {selectedSeeker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedSeeker(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedSeeker.seeker?.selfieUrl ? (
                  <img
                    src={selectedSeeker.seeker.selfieUrl}
                    alt="Seeker Profile"
                    className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedSeeker.seeker ? `${selectedSeeker.seeker.firstName} ${selectedSeeker.seeker.lastName || ''}`.trim() : 'Room Seeker Profile'}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Preferred Location: {selectedSeeker.preferredLocation}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {selectedSeeker.matchPercentage ?? 85}% Match
              </span>
            </div>

            {/* Seeker Profile Cover Image Header */}
            {selectedSeeker.seeker?.selfieUrl && (
              <div className="relative h-52 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={selectedSeeker.seeker.selfieUrl}
                  alt="Seeker Profile Photo"
                  className="h-full w-full object-cover"
                />
                {selectedSeeker.seeker.identityVerified && (
                  <span className="absolute top-3 right-3 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold shadow flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Admin Verified Seeker
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-medium">Maximum Budget</span>
                <p className="font-extrabold text-emerald-700 text-lg">₹{selectedSeeker.maxBudget} / month</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Room Preference</span>
                <p className="font-bold text-slate-800 text-sm capitalize">{selectedSeeker.roomTypePreference.replace('_', ' ')}</p>
              </div>
            </div>

            {selectedSeeker.requiredAmenities && selectedSeeker.requiredAmenities.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Required Room Amenities</span>
                <div className="flex flex-wrap gap-2">
                  {selectedSeeker.requiredAmenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {amenity.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SEEKER PROFILE DETAILS BOX */}
            {selectedSeeker.seeker && (
              <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedSeeker.seeker.selfieUrl ? (
                      <img
                        src={selectedSeeker.seeker.selfieUrl}
                        alt="Seeker Profile"
                        className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500 shadow"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center">
                        {selectedSeeker.seeker.firstName[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{selectedSeeker.seeker.firstName} {selectedSeeker.seeker.lastName || ''}</span>
                      </h4>
                      <p className="text-slate-500 text-[11px]">{selectedSeeker.seeker.email}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Admin Verified Seeker
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/40">
                  {selectedSeeker.seeker.occupation && (
                    <p><span className="text-slate-500">Occupation:</span> <strong>{selectedSeeker.seeker.occupation}</strong></p>
                  )}
                  {selectedSeeker.seeker.gender && (
                    <p><span className="text-slate-500">Gender:</span> <strong className="capitalize">{selectedSeeker.seeker.gender}</strong></p>
                  )}
                </div>

                {selectedSeeker.seeker.bio && (
                  <p className="text-slate-600 italic text-[11px] bg-white p-2.5 rounded-xl border border-emerald-100">
                    &quot;{selectedSeeker.seeker.bio}&quot;
                  </p>
                )}

                {/* Seeker Lifestyle Habits */}
                {selectedSeeker.seeker.lifestyle && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Seeker Lifestyle Habits</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Smoking: <strong className="capitalize">{selectedSeeker.seeker.lifestyle.smoking}</strong>
                      </span>
                      <span className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Drinking: <strong className="capitalize">{selectedSeeker.seeker.lifestyle.drinking}</strong>
                      </span>
                      <span className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Cleanliness: <strong className="capitalize">{selectedSeeker.seeker.lifestyle.cleanliness.replace('_', ' ')}</strong>
                      </span>
                      <span className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Visitors: <strong className="capitalize">{selectedSeeker.seeker.lifestyle.visitorPolicy}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setSelectedSeeker(null)}
                className="text-xs text-slate-600 border-slate-300"
              >
                Close Details
              </Button>

              {(() => {
                const seekerUserId = selectedSeeker.userId || selectedSeeker.seeker?.id;
                const status = getInterestStatus(selectedSeeker.id, seekerUserId);

                if (status === 'accepted') {
                  return (
                    <Button
                      size="sm"
                      disabled
                      className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold"
                      leftIcon={<Check className="w-4 h-4 text-emerald-600" />}
                    >
                      Connected 🎉
                    </Button>
                  );
                }
                if (status === 'pending') {
                  return (
                    <Button
                      size="sm"
                      disabled
                      className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                      leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
                    >
                      Request Pending ⏳
                    </Button>
                  );
                }
                if (status === 'received_pending') {
                  return (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSeeker(null);
                        setInterestTab('received');
                      }}
                      className="bg-blue-50 text-blue-800 border border-blue-300 font-semibold hover:bg-blue-100"
                      leftIcon={<Heart className="w-4 h-4 text-blue-600" />}
                    >
                      Respond in Requests
                    </Button>
                  );
                }
                return (
                  <Button
                    disabled={processingId === selectedSeeker.id}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    leftIcon={<Heart className="w-4 h-4" />}
                    onClick={() => {
                      const seekerName = selectedSeeker.seeker ? `${selectedSeeker.seeker.firstName} ${selectedSeeker.seeker.lastName || ''}`.trim() : selectedSeeker.preferredLocation;
                      handleSendInterest(selectedSeeker.id, seekerName, seekerUserId);
                      setSelectedSeeker(null);
                    }}
                  >
                    {processingId === selectedSeeker.id ? 'Sending...' : 'Send Interest Request'}
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
