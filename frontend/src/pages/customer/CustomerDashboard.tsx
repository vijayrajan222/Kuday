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
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { onboardingService } from '@/services/onboardingService';
import { DASHBOARD_STATS, RECENT_ACTIVITY, ROOMMATE_MATCHES } from '@/data/dummyData';
import type { RoomEntity, SeekerPreferenceEntity } from '@/types/onboarding.types';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, loginSuccess } = useAuth();
  const firstName = user?.firstName;

  const [isOnboarded, setIsOnboarded] = useState<boolean>(user?.isOnboarded ?? false);
  const [role, setRole] = useState<'host' | 'seeker' | 'none'>(
    (user?.role as 'host' | 'seeker' | 'none') || 'none'
  );

  const [rooms, setRooms] = useState<RoomEntity[]>([]);
  const [seekers, setSeekers] = useState<SeekerPreferenceEntity[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (user?.id) {
      onboardingService
        .getUserProfile(user.id)
        .then((profile) => {
          if (profile) {
            const onboardedState = Boolean(profile.isOnboarded);
            const userRole = (profile.role as 'host' | 'seeker' | 'none') || 'none';

            setIsOnboarded(onboardedState);
            setRole(userRole);

            if (
              profile.isOnboarded !== user.isOnboarded ||
              profile.role !== user.role
            ) {
              loginSuccess(localStorage.getItem('kuday_token') || '', {
                ...user,
                isOnboarded: onboardedState,
                role: userRole,
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [user, loginSuccess]);

  // Fetch real rooms / seeker profiles when onboarded
  useEffect(() => {
    if (!isOnboarded) return;

    let isMounted = true;
    if (role === 'seeker') {
      onboardingService
        .getRooms()
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
        .getSeekerPreferences()
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
  }, [isOnboarded, role]);

  const matches = useMemo(
    () => [...ROOMMATE_MATCHES].sort((a, b) => b.matchPercent - a.matchPercent),
    []
  );

  const handleSendInterest = useCallback((name: string) => {
    toast.success(`Interest sent to ${name}! They will be notified.`);
  }, []);

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
              ? "Complete your Personal Profile, Lifestyle Preferences, Identity Verification, and Role Setup to unlock personalized room & roommate matches."
              : role === 'host'
              ? "You are logged in as a Host. Browse matching seekers, review their lifestyles, and send interests to potential roommates."
              : "You are logged in as a Seeker. Browse available room listings, check host amenities, and find your dream home."}
          </p>

          {!isOnboarded && (
            <Button
              variant="secondary"
              className="mt-5 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-md border-none"
              leftIcon={<UserCircle className="h-4 w-4 text-emerald-600" />}
              onClick={() => navigate(ROUTES.ONBOARDING_PROFILE)}
            >
              Complete 5-Step Setup Now
            </Button>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STATS.map((stat) => (
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
                  {role === 'seeker' ? 'Available Room Listings' : 'Matching Roommate Seekers'}
                </h2>
                <p className="text-xs text-slate-500">
                  {role === 'seeker'
                    ? 'Explore properties matching your location and budget'
                    : 'Profiles looking for rooms in your area'}
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
                  {rooms.map((room) => (
                    <Card key={room.id} className="overflow-hidden border border-slate-200 p-0 shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-44 bg-slate-100">
                        {room.images && room.images.length > 0 ? (
                          <img src={room.images[0]} alt={room.roomType} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Home className="h-10 w-10" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                          92% Match
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base capitalize">
                              {room.roomType.replace('_', ' ')}
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

                        {room.availabilityNotes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="font-medium text-slate-700">Visits:</span> {room.availabilityNotes}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {room.amenities.map((a, i) => (
                            <span key={i} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                              {a.replace('_', ' ')}
                            </span>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          fullWidth
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          leftIcon={<Heart className="h-4 w-4" />}
                          onClick={() => handleSendInterest(room.location)}
                        >
                          Send Interest
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Fallback to Match Cards if no custom room created yet */
                <div className="grid gap-4 sm:grid-cols-2">
                  {matches.map((m) => (
                    <Card key={m.id} className="p-5 space-y-3 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">{m.name}</h3>
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                          {m.matchPercent}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{m.location} • ₹{m.budget}/mo</p>
                      <Button
                        size="sm"
                        fullWidth
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => handleSendInterest(m.name)}
                      >
                        Send Interest
                      </Button>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              /* HOST VIEW: List of Seekers */
              seekers.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {seekers.map((seeker) => (
                    <Card key={seeker.id} className="p-4 space-y-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800">
                            <UserCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Seeker Profile</h3>
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3 text-emerald-600" />
                              {seeker.preferredLocation}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                          95% Match
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 text-xs space-y-1">
                        <p className="flex justify-between">
                          <span className="text-slate-500">Max Budget:</span>
                          <span className="font-bold text-slate-800">₹{seeker.maxBudget}/mo</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">Room Pref:</span>
                          <span className="font-semibold text-slate-800 capitalize">
                            {seeker.roomTypePreference.replace('_', ' ')}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {seeker.requiredAmenities.map((a, i) => (
                          <span key={i} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            {a.replace('_', ' ')}
                          </span>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        fullWidth
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        leftIcon={<Heart className="h-4 w-4" />}
                        onClick={() => handleSendInterest('Seeker')}
                      >
                        Send Interest
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Fallback Seeker Cards */
                <div className="grid gap-4 sm:grid-cols-2">
                  {matches.map((m) => (
                    <Card key={m.id} className="p-5 space-y-3 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">{m.name}</h3>
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                          {m.matchPercent}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{m.location} • Budget: ₹{m.budget}/mo</p>
                      <Button
                        size="sm"
                        fullWidth
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => handleSendInterest(m.name)}
                      >
                        Send Interest
                      </Button>
                    </Card>
                  ))}
                </div>
              )
            )}
          </section>

          {/* Activity Column */}
          <section aria-labelledby="activity-heading" className="space-y-4">
            <h2 id="activity-heading" className="text-lg font-bold text-slate-900">
              Recent Activity
            </h2>
            <Card className="divide-y divide-slate-100 p-0 border border-slate-200 shadow-sm">
              {RECENT_ACTIVITY.map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm text-slate-700">{item.text}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
