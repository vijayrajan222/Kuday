import { useCallback, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  UserCheck,
  MapPin,
  Heart,
  ArrowUpDown,
  Search,
  X,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInterest } from '@/hooks/useInterest';
import { ROUTES } from '@/constants/routes';
import { deduplicateAmenities } from '@/utils/amenitiesHelper';
import { onboardingService } from '@/services/onboardingService';
import type { RoomEntity, SeekerPreferenceEntity } from '@/types/onboarding.types';

// Memoized modular subcomponents
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentInterestCard } from '@/components/dashboard/RecentInterestCard';
import { ActiveListingCard } from '@/components/dashboard/ActiveListingCard';
import { PotentialMatchCard } from '@/components/dashboard/PotentialMatchCard';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const firstName = user?.firstName;

  const isOnboarded = Boolean(user?.isOnboarded);
  const role = (user?.role as 'host' | 'seeker' | 'none') || 'none';

  // Sync active role from backend on mount so switching between host & seeker is always in sync
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    onboardingService
      .getUserProfile(user.id)
      .then((profile) => {
        if (isMounted && profile?.role && profile.role !== user.role) {
          updateUser({ role: profile.role });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role, updateUser]);

  // Matches state
  const [rooms, setRooms] = useState<RoomEntity[]>([]);
  const [seekers, setSeekers] = useState<SeekerPreferenceEntity[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // User's own active listing or preference
  const [myRoom, setMyRoom] = useState<RoomEntity | null>(null);
  const [myPreference, setMyPreference] = useState<SeekerPreferenceEntity | null>(null);

  // Search, filter, and sort state for potential matches
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'priceAsc' | 'priceDesc'>('match');
  const [showAllMatches, setShowAllMatches] = useState(false);

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

  // Modal inspection states
  const [selectedRoom, setSelectedRoom] = useState<RoomEntity | null>(null);
  const [selectedSeeker, setSelectedSeeker] = useState<SeekerPreferenceEntity | null>(null);
  const [showAllInterestsModal, setShowAllInterestsModal] = useState(false);

  // Fetch available matches based on role
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

      // Also fetch seeker's own preference for Active Preference card
      onboardingService
        .getSeekerPreferences(user.id)
        .then((res) => {
          if (isMounted && res) {
            const singlePref = Array.isArray(res) ? (res.length > 0 ? res[0] : null) : res;
            setMyPreference(singlePref);
          }
        })
        .catch(() => {});
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

      // Also fetch host's own rooms for Active Listing card
      onboardingService
        .getRooms(user.id)
        .then((res) => {
          if (isMounted && res && res.length > 0) {
            setMyRoom(res[0]);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [isOnboarded, role, user?.id]);

  // Derived counts
  const connectedCount = useMemo(() => {
    return (
      sentInterests.filter((i) => i.status === 'accepted').length +
      receivedInterests.filter((i) => i.status === 'accepted').length
    );
  }, [sentInterests, receivedInterests]);

  const pendingReceivedCount = useMemo(() => {
    return receivedInterests.filter((i) => i.status === 'pending').length;
  }, [receivedInterests]);

  const totalInterestsCount = useMemo(() => {
    return sentInterests.length + receivedInterests.length;
  }, [sentInterests.length, receivedInterests.length]);

  // Handle Interest dispatch
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

  // Filtered and sorted matches
  const filteredRooms = useMemo(() => {
    if (role !== 'seeker') return [];
    let list = [...rooms];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.roomType?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.host?.firstName?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'priceAsc') {
      list.sort((a, b) => a.monthlyRent - b.monthlyRent);
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => b.monthlyRent - a.monthlyRent);
    } else {
      list.sort((a, b) => (b.matchPercentage ?? 85) - (a.matchPercentage ?? 85));
    }

    return list;
  }, [role, rooms, searchQuery, sortBy]);

  const filteredSeekers = useMemo(() => {
    if (role !== 'host') return [];
    let list = [...seekers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.preferredLocation?.toLowerCase().includes(q) ||
          s.roomTypePreference?.toLowerCase().includes(q) ||
          s.seeker?.firstName?.toLowerCase().includes(q) ||
          s.seeker?.occupation?.toLowerCase().includes(q) ||
          s.seeker?.bio?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'priceAsc') {
      list.sort((a, b) => a.maxBudget - b.maxBudget);
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => b.maxBudget - a.maxBudget);
    } else {
      list.sort((a, b) => (b.matchPercentage ?? 85) - (a.matchPercentage ?? 85));
    }

    return list;
  }, [role, seekers, searchQuery, sortBy]);

  // Top 4 or all items for display in the 4-column row
  const displayedRooms = useMemo(() => {
    return showAllMatches ? filteredRooms : filteredRooms.slice(0, 4);
  }, [filteredRooms, showAllMatches]);

  const displayedSeekers = useMemo(() => {
    return showAllMatches ? filteredSeekers : filteredSeekers.slice(0, 4);
  }, [filteredSeekers, showAllMatches]);

  // Recent interests items to showcase in the middle grid (up to 2)
  const recentShowcaseInterests = useMemo(() => {
    const list = [...receivedInterests, ...sentInterests];
    return list.slice(0, 2);
  }, [receivedInterests, sentInterests]);

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Status */}
      <section className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {role === 'host' ? 'Host Dashboard' : 'Seeker Dashboard'}
            {firstName ? <span className="text-slate-400 font-normal text-xl sm:text-2xl ml-2">({firstName})</span> : null}
          </h1>
        </div>

        {/* Status Alert Banner */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-xs sm:text-sm text-slate-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            {!isOnboarded ? (
              <span>
                Your onboarding is incomplete.{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ONBOARDING_PROFILE)}
                  className="font-bold underline text-slate-900 hover:text-emerald-700"
                >
                  Complete Setup Now
                </button>
              </span>
            ) : role === 'host' ? (
              myRoom ? (
                <span>
                  Your listing for{' '}
                  <strong className="text-slate-900">
                    &quot;{myRoom.title || myRoom.roomType.replace(/_/g, ' ')}&quot;
                  </strong>{' '}
                  is {myRoom.isActive === false ? 'currently inactive.' : 'active and visible.'}
                </span>
              ) : (
                <span>
                  You have not posted any room listing yet.{' '}
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.PROFILE, { state: { openAddListing: true } })}
                    className="font-bold underline text-slate-900 hover:text-black ml-1"
                  >
                    Add a listing
                  </button>{' '}
                  to connect with seekers.
                </span>
              )
            ) : myPreference ? (
              <span>
                Your roommate preference for{' '}
                <strong className="text-slate-900">
                  &quot;{myPreference.preferredLocation}&quot;
                </strong>{' '}
                is {myPreference.isActive === false ? 'currently inactive.' : 'active and verified.'}
              </span>
            ) : (
              <span>
                You have not set your search preferences yet.{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.PROFILE, { state: { openEditSeeker: true } })}
                  className="font-bold underline text-slate-900 hover:text-black ml-1"
                >
                  Add preferences
                </button>{' '}
                to get matched with hosts.
              </span>
            )}
          </span>
        </div>
      </section>

      {/* 2. Metric Cards (100% Real Dynamic Data) */}
      <section aria-label="Metrics" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label={role === 'host' ? 'Verified Seekers' : 'Available Rooms'}
          value={role === 'host' ? seekers.length : rooms.length}
        />
        <MetricCard label="Connected" value={connectedCount} />
        <MetricCard label="Pending Requests" value={pendingReceivedCount} />
        <MetricCard label="Sent Interests" value={sentInterests.length} />
      </section>

      {/* 3. Middle Section: 2 Columns */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop): Recent Interests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Interests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Recent Interests</h2>
              {totalInterestsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllInterestsModal(true)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  See all ({totalInterestsCount})
                </button>
              )}
            </div>

            {recentShowcaseInterests.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentShowcaseInterests.map((item) => {
                  const person = item.senderId === user?.id ? item.receiver : item.sender;
                  const personName = person
                    ? `${person.firstName} ${person.lastName || ''}`.trim()
                    : 'Community Member';
                  const snippet =
                    item.message ||
                    (item.targetType === 'room'
                      ? 'Interested in viewing this room listing.'
                      : 'Interested in connecting as potential flatmates.');

                  return (
                    <RecentInterestCard
                      key={item.id}
                      name={personName}
                      avatarUrl={person?.selfieUrl}
                      matchScore={94}
                      messageSnippet={snippet}
                      onMessage={() => {
                        if (person?.id) {
                          navigate(ROUTES.MESSAGES, {
                            state: { recipientId: person.id, recipientName: personName },
                          });
                        } else {
                          navigate(ROUTES.MESSAGES);
                        }
                      }}
                      onViewProfile={() => {
                        if (person?.id) {
                          navigate(ROUTES.USER_PROFILE.replace(':userId', person.id));
                        } else if (role === 'seeker') {
                          const found = rooms.find((r) => r.id === item.targetId);
                          if (found) navigate(ROUTES.ROOM_DETAILS.replace(':roomId', found.id));
                          else setShowAllInterestsModal(true);
                        } else {
                          setShowAllInterestsModal(true);
                        }
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No connection requests yet</p>
                <p className="mt-1 text-slate-400">
                  {role === 'seeker'
                    ? 'Explore verified rooms below and send interest to get connected.'
                    : 'Explore verified seekers below and send interest to connect.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Listing / Preference Card */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            {role === 'host'
              ? myRoom ? 'Active Listing' : 'Listing Status'
              : myPreference ? 'Active Preference' : 'Preference Status'}
          </span>
          {role === 'host' ? (
            myRoom ? (
              <ActiveListingCard
                title={myRoom.title || myRoom.roomType.replace(/_/g, ' ')}
                subtitle={`${myRoom.location} • ₹${myRoom.monthlyRent.toLocaleString('en-IN')}/mo`}
                imageUrl={myRoom.images?.[0]}
                fallbackInitial={firstName || user?.email || 'H'}
                badgeText={myRoom.isActive === false ? 'Inactive' : 'Active'}
                isActive={myRoom.isActive !== false}
                buttonText="Manage Listing"
                onManage={() => navigate(ROUTES.PROFILE)}
              />
            ) : (
              <ActiveListingCard
                title="No Active Listing"
                subtitle="You haven't listed any room yet."
                badgeText="Inactive"
                isActive={false}
                buttonText="Add Listing"
                onManage={() => navigate(ROUTES.PROFILE, { state: { openAddListing: true } })}
              />
            )
          ) : myPreference ? (
            <ActiveListingCard
              title={myPreference.roomTypePreference.replace(/_/g, ' ')}
              subtitle={`${myPreference.preferredLocation} • Max ₹${myPreference.maxBudget.toLocaleString('en-IN')}/mo`}
              imageUrl={user?.selfieUrl}
              fallbackInitial={firstName || user?.email || 'S'}
              badgeText={myPreference.isActive === false ? 'Inactive' : 'Active'}
              isActive={myPreference.isActive !== false}
              buttonText="Manage Preferences"
              onManage={() => navigate(ROUTES.PROFILE)}
            />
          ) : (
            <ActiveListingCard
              title="No Active Preference"
              subtitle="Set your room preferences to match with hosts."
              badgeText="Inactive"
              isActive={false}
              buttonText="Add Preferences"
              onManage={() => navigate(ROUTES.PROFILE, { state: { openEditSeeker: true } })}
            />
          )}
        </div>
      </section>

      {/* 4. Bottom Section: Potential Seekers / Potential Rooms (Top 3 Grid) */}
      <section id="potential-matches-section" className="space-y-5 pt-4 border-t border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {role === 'host' ? 'Potential Seekers' : 'Potential Rooms'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {role === 'host'
              ? "Matches based on your space's architectural profile and house rules."
              : 'Matches tailored to your budget, preferred location, and lifestyle.'}
          </p>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={role === 'host' ? 'Search for Seekers...' : 'Search for Rooms...'}
              className="w-full rounded-full border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSortBy((prev) =>
                  prev === 'match' ? 'priceAsc' : prev === 'priceAsc' ? 'priceDesc' : 'match'
                );
              }}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {sortBy === 'match'
                  ? 'Sort: Match %'
                  : sortBy === 'priceAsc'
                  ? 'Price: Low-High'
                  : 'Price: High-Low'}
              </span>
            </button>
          </div>
        </div>

        {/* Top 3 Matches Grid */}
        {loadingMatches ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading matches...</div>
        ) : role === 'seeker' ? (
          /* SEEKER VIEW: Room Listings Grid */
          filteredRooms.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {displayedRooms.map((room) => {
                  const hostUserId = room.hostId || room.host?.id || '';
                  const interestStatus = getInterestStatus(room.id, hostUserId);
                  const hostName = room.host
                    ? `${room.host.firstName} ${room.host.lastName || ''}`.trim()
                    : 'Property Host';

                  return (
                    <PotentialMatchCard
                      key={room.id}
                      id={room.id}
                      name={room.title || room.roomType.replace('_', ' ')}
                      location={room.location}
                      priceOrBudget={`₹${room.monthlyRent}`}
                      priceLabel="/month"
                      badgeTag={room.roomType.replace('_', ' ')}
                      occupationOrType={`Host: ${hostName}`}
                      imageUrl={room.images?.[0] || room.host?.selfieUrl}
                      matchScore={room.matchPercentage ?? 85}
                      isVerified={Boolean(room.host?.identityVerified)}
                      status={interestStatus}
                      isProcessing={processingId === room.id}
                      onDetails={() => navigate(ROUTES.ROOM_DETAILS.replace(':roomId', room.id))}
                      onAction={() => {
                        if (interestStatus === 'received_pending') {
                          setShowAllInterestsModal(true);
                        } else {
                          handleSendInterest(room.id, hostName, hostUserId);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {filteredRooms.length > 4 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllMatches((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:underline"
                  >
                    {showAllMatches ? (
                      <>
                        Show Top 4 Matches <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show all ({filteredRooms.length}) rooms <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              No rooms found matching your search.
            </div>
          )
        ) : (
          /* HOST VIEW: Seeker Preferences Grid */
          filteredSeekers.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {displayedSeekers.map((seeker) => {
                  const seekerUserId = seeker.userId || seeker.seeker?.id;
                  const interestStatus = getInterestStatus(seeker.id, seekerUserId);
                  const seekerName = seeker.seeker
                    ? `${seeker.seeker.firstName} ${seeker.seeker.lastName || ''}`.trim()
                    : 'Room Seeker';

                  return (
                    <PotentialMatchCard
                      key={seeker.id}
                      id={seeker.id}
                      name={seekerName}
                      location={seeker.preferredLocation}
                      priceOrBudget={`₹${seeker.maxBudget}`}
                      priceLabel="max budget"
                      badgeTag={seeker.roomTypePreference.replace('_', ' ')}
                      occupationOrType={seeker.seeker?.occupation?.replace('_', ' ')}
                      imageUrl={seeker.seeker?.selfieUrl}
                      matchScore={seeker.matchPercentage ?? 85}
                      isVerified={Boolean(seeker.seeker?.identityVerified)}
                      status={interestStatus}
                      isProcessing={processingId === seeker.id}
                      onDetails={() => {
                        if (seekerUserId) {
                          navigate(ROUTES.USER_PROFILE.replace(':userId', seekerUserId));
                        } else {
                          setSelectedSeeker(seeker);
                        }
                      }}
                      onAction={() => {
                        if (interestStatus === 'received_pending') {
                          setShowAllInterestsModal(true);
                        } else {
                          handleSendInterest(seeker.id, seekerName, seekerUserId);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {filteredSeekers.length > 4 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllMatches((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:underline"
                  >
                    {showAllMatches ? (
                      <>
                        Show Top 4 Matches <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show all ({filteredSeekers.length}) seekers <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              No verified seekers found matching your search.
            </div>
          )
        )}
      </section>

      {/* ALL CONNECTION REQUESTS & INTERESTS MODAL */}
      {showAllInterestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAllInterestsModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" /> Connection Requests
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage incoming and outgoing roommate connection requests.
              </p>
            </div>

            {/* Received Requests */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Received ({receivedInterests.length})
              </h4>
              {receivedInterests.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No incoming requests yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {receivedInterests.map((item) => {
                    const senderName = item.sender
                      ? `${item.sender.firstName} ${item.sender.lastName || ''}`.trim()
                      : 'A User';
                    const isConnected = item.status === 'accepted';

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
                              <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center">
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
                              isConnected
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'declined'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isConnected ? 'ACCEPTED' : item.status.toUpperCase()}
                          </span>
                        </div>

                        {item.status === 'pending' && !isConnected && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={processingId === item.id}
                              onClick={() => acceptInterest(item.id)}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Accept
                            </button>
                            <button
                              type="button"
                              disabled={processingId === item.id}
                              onClick={() => declineInterest(item.id)}
                              className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1"
                            >
                              <X className="h-3 w-3" /> Decline
                            </button>
                          </div>
                        )}

                        {isConnected && item.sender?.email && (
                          <a
                            href={`mailto:${item.sender.email}`}
                            className="text-[11px] font-semibold text-emerald-700 hover:underline block pt-0.5"
                          >
                            Connect: {item.sender.email}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sent ({sentInterests.length})
              </h4>
              {sentInterests.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No sent requests yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {sentInterests.map((item) => {
                    const receiverName = item.receiver
                      ? `${item.receiver.firstName} ${item.receiver.lastName || ''}`.trim()
                      : 'Community Match';
                    const isConnected = item.status === 'accepted';

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{receiverName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isConnected
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'declined'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isConnected ? 'ACCEPTED' : item.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Sent for {item.targetType === 'room' ? 'Room Listing' : 'Roommate Profile'}
                        </p>
                        {isConnected && item.receiver?.email && (
                          <a
                            href={`mailto:${item.receiver.email}`}
                            className="text-[11px] font-semibold text-emerald-700 hover:underline block pt-0.5"
                          >
                            Email: {item.receiver.email}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROOM LISTING FULL INSPECTION MODAL */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
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
                <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 capitalize">
                    {selectedRoom.title || selectedRoom.roomType.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedRoom.location}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs flex items-center gap-1">
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
                <p className="font-extrabold text-slate-900 text-lg">₹{selectedRoom.monthlyRent} / month</p>
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
                  {deduplicateAmenities(selectedRoom.amenities).map((amenity) => (
                    <span
                      key={amenity.id}
                      className="rounded-xl bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {amenity.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* HOST PROFILE DETAILS BOX */}
            {selectedRoom.host && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedRoom.host.selfieUrl ? (
                      <img
                        src={selectedRoom.host.selfieUrl}
                        alt="Host Profile"
                        className="h-10 w-10 rounded-full object-cover border border-slate-300 shadow-xs"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center">
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Host
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
                  {selectedRoom.host.occupation && (
                    <p><span className="text-slate-500">Occupation:</span> <strong>{selectedRoom.host.occupation}</strong></p>
                  )}
                  {selectedRoom.host.gender && (
                    <p><span className="text-slate-500">Gender:</span> <strong className="capitalize">{selectedRoom.host.gender}</strong></p>
                  )}
                </div>

                {selectedRoom.host.bio && (
                  <p className="text-slate-600 italic text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                    &quot;{selectedRoom.host.bio}&quot;
                  </p>
                )}

                {/* Host Lifestyle Habits */}
                {selectedRoom.host.lifestyle && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Host Lifestyle Habits</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Smoking: <strong className="capitalize">{selectedRoom.host.lifestyle.smoking}</strong>
                      </span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Drinking: <strong className="capitalize">{selectedRoom.host.lifestyle.drinking}</strong>
                      </span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Cleanliness: <strong className="capitalize">{selectedRoom.host.lifestyle.cleanliness.replace('_', ' ')}</strong>
                      </span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Visitors: <strong className="capitalize">{selectedRoom.host.lifestyle.visitorPolicy}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="text-xs text-slate-600 border border-slate-200 bg-white px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                Close Details
              </button>

              {(() => {
                const hostUserId = selectedRoom.hostId || selectedRoom.host?.id || '';
                const status = getInterestStatus(selectedRoom.id, hostUserId);

                if (status === 'accepted') {
                  return (
                    <button
                      type="button"
                      disabled
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Check className="w-4 h-4 text-emerald-600" /> Connected 🎉
                    </button>
                  );
                }
                if (status === 'pending') {
                  return (
                    <button
                      type="button"
                      disabled
                      className="bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Clock className="w-4 h-4 text-amber-600" /> Request Pending ⏳
                    </button>
                  );
                }
                if (status === 'received_pending') {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoom(null);
                        setShowAllInterestsModal(true);
                      }}
                      className="bg-blue-50 text-blue-800 border border-blue-200 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Heart className="w-4 h-4 text-blue-600" /> Respond in Requests
                    </button>
                  );
                }
                return (
                  <button
                    type="button"
                    disabled={processingId === selectedRoom.id}
                    className="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1 disabled:opacity-50"
                    onClick={() => {
                      const hostName = selectedRoom.host
                        ? `${selectedRoom.host.firstName} ${selectedRoom.host.lastName || ''}`.trim()
                        : selectedRoom.location;
                      handleSendInterest(selectedRoom.id, hostName, hostUserId);
                      setSelectedRoom(null);
                    }}
                  >
                    <Heart className="w-4 h-4" />
                    {processingId === selectedRoom.id ? 'Sending...' : 'Send Interest & Request Room'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SEEKER FULL INSPECTION MODAL */}
      {selectedSeeker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
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
                    className="h-12 w-12 rounded-full object-cover border border-slate-300 shadow-xs"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <UserCheck className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedSeeker.seeker
                      ? `${selectedSeeker.seeker.firstName} ${selectedSeeker.seeker.lastName || ''}`.trim()
                      : 'Room Seeker Profile'}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Preferred: {selectedSeeker.preferredLocation}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {selectedSeeker.matchPercentage ?? 85}% Match
              </span>
            </div>

            {/* Profile Cover Image */}
            {selectedSeeker.seeker?.selfieUrl && (
              <div className="relative h-52 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={selectedSeeker.seeker.selfieUrl}
                  alt="Seeker Profile Photo"
                  className="h-full w-full object-cover"
                />
                {selectedSeeker.seeker.identityVerified && (
                  <span className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Seeker
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-medium">Maximum Budget</span>
                <p className="font-extrabold text-slate-900 text-lg">₹{selectedSeeker.maxBudget} / month</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Room Preference</span>
                <p className="font-bold text-slate-800 text-sm capitalize">
                  {selectedSeeker.roomTypePreference.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* SEEKER PROFILE DETAILS BOX */}
            {selectedSeeker.seeker && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {selectedSeeker.seeker.firstName} {selectedSeeker.seeker.lastName || ''}
                    </h4>
                    <p className="text-slate-500 text-[11px]">{selectedSeeker.seeker.email}</p>
                  </div>

                  {selectedSeeker.seeker.identityVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Seeker
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
                  {selectedSeeker.seeker.occupation && (
                    <p><span className="text-slate-500">Occupation:</span> <strong>{selectedSeeker.seeker.occupation}</strong></p>
                  )}
                  {selectedSeeker.seeker.gender && (
                    <p><span className="text-slate-500">Gender:</span> <strong className="capitalize">{selectedSeeker.seeker.gender}</strong></p>
                  )}
                </div>

                {selectedSeeker.seeker.bio && (
                  <p className="text-slate-600 italic text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                    &quot;{selectedSeeker.seeker.bio}&quot;
                  </p>
                )}

                {/* Seeker Lifestyle Habits */}
                {selectedSeeker.seeker.lifestyle && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Seeker Lifestyle Habits</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Smoking: <strong className="capitalize">{selectedSeeker.seeker.lifestyle.smoking}</strong>
                      </span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Drinking: <strong className="capitalize">{selectedSeeker.seeker.lifestyle.drinking}</strong>
                      </span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Cleanliness: <strong className="capitalize">{selectedSeeker.seeker.lifestyle.cleanliness.replace('_', ' ')}</strong>
                      </span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-700">
                        Visitors: <strong className="capitalize">{selectedSeeker.seeker.lifestyle.visitorPolicy}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedSeeker(null)}
                className="text-xs text-slate-600 border border-slate-200 bg-white px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                Close Details
              </button>

              {(() => {
                const seekerUserId = selectedSeeker.userId || selectedSeeker.seeker?.id;
                const status = getInterestStatus(selectedSeeker.id, seekerUserId);

                if (status === 'accepted') {
                  return (
                    <button
                      type="button"
                      disabled
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Check className="w-4 h-4 text-emerald-600" /> Connected 🎉
                    </button>
                  );
                }
                if (status === 'pending') {
                  return (
                    <button
                      type="button"
                      disabled
                      className="bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Clock className="w-4 h-4 text-amber-600" /> Request Pending ⏳
                    </button>
                  );
                }
                if (status === 'received_pending') {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSeeker(null);
                        setShowAllInterestsModal(true);
                      }}
                      className="bg-blue-50 text-blue-800 border border-blue-200 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Heart className="w-4 h-4 text-blue-600" /> Respond in Requests
                    </button>
                  );
                }
                return (
                  <button
                    type="button"
                    disabled={processingId === selectedSeeker.id}
                    className="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1 disabled:opacity-50"
                    onClick={() => {
                      const seekerName = selectedSeeker.seeker
                        ? `${selectedSeeker.seeker.firstName} ${selectedSeeker.seeker.lastName || ''}`.trim()
                        : selectedSeeker.preferredLocation;
                      handleSendInterest(selectedSeeker.id, seekerName, seekerUserId);
                      setSelectedSeeker(null);
                    }}
                  >
                    <Heart className="w-4 h-4" />
                    {processingId === selectedSeeker.id ? 'Sending...' : 'Send Interest Request'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
