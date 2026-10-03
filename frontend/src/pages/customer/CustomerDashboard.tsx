import { useCallback, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, UserCircle, ShieldAlert, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { MatchCard } from '@/components/roommate/MatchCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { onboardingService } from '@/services/onboardingService';
import { DASHBOARD_STATS, RECENT_ACTIVITY, ROOMMATE_MATCHES } from '@/data/dummyData';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, loginSuccess } = useAuth();
  const firstName = user?.firstName;
  const [isOnboarded, setIsOnboarded] = useState<boolean>(user?.isOnboarded ?? false);

  useEffect(() => {
    if (user?.id) {
      onboardingService.getUserProfile(user.id).then((profile) => {
        if (profile) {
          setIsOnboarded(Boolean(profile.isOnboarded));
          if (profile.isOnboarded !== user.isOnboarded) {
            loginSuccess(localStorage.getItem('token') || '', {
              ...user,
              isOnboarded: profile.isOnboarded,
              role: profile.role,
            });
          }
        }
      }).catch(() => {});
    }
  }, [user?.id]);

  // sorted once, not on every render
  const matches = useMemo(() => [...ROOMMATE_MATCHES].sort((a, b) => b.matchPercent - a.matchPercent), []);

  const handleConnect = useCallback((id: string) => {
    const match = ROOMMATE_MATCHES.find((m) => m.id === id);
    toast.info(`Connect request sent to ${match?.name ?? 'roommate'} (demo)`);
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Hero banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            {isOnboarded ? "Onboarding Completed" : "Action Required"}
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome{firstName ? `, ${firstName}` : ''} 👋</h1>
          
          <p className="mt-2 text-emerald-50 text-sm sm:text-base">
            {isOnboarded
              ? "Your personal profile and identity verification are complete! Now select your role to proceed."
              : "Complete your Personal Profile, Lifestyle Preferences, and ID Verification to unlock roommate matches."}
          </p>

          {!isOnboarded ? (
            <Button
              variant="secondary"
              className="mt-5 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-md"
              leftIcon={<UserCircle className="h-4 w-4 text-emerald-600" />}
              onClick={() => navigate(ROUTES.ONBOARDING_PROFILE)}
            >
              Complete Profile & Lifestyle Setup
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="mt-5 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-md"
              leftIcon={<UserCheck className="h-4 w-4 text-emerald-600" />}
              onClick={() => toast.info("Role Selection setup coming up next!")}
            >
              Select Role (Host or Seeker)
            </Button>
          )}
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STATS.map((stat) => (
          <StatCard key={stat.id} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} />
        ))}
      </section>

      {/* Conditional Content based on Onboarding Status */}
      {!isOnboarded ? (
        <section aria-labelledby="onboarding-notice" className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 id="onboarding-notice" className="text-lg font-bold text-amber-950">
                Unlock Roommate Matches & Activity
              </h2>
              <p className="mt-1 text-sm text-amber-800/90 leading-relaxed max-w-2xl">
                Your suggested matches and recent activity are hidden until your Personal Profile, Lifestyle Preferences, and Identity Verification are completed.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  size="md"
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm"
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => navigate(ROUTES.ONBOARDING_PROFILE)}
                >
                  Finish Setup Now
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Matches */}
          <section aria-labelledby="matches-heading" className="space-y-4 lg:col-span-2">
            <h2 id="matches-heading" className="text-lg font-bold text-slate-900">
              Suggested matches
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} onConnect={handleConnect} />
              ))}
            </div>
          </section>

          {/* Activity */}
          <section aria-labelledby="activity-heading" className="space-y-4">
            <h2 id="activity-heading" className="text-lg font-bold text-slate-900">
              Recent activity
            </h2>
            <Card className="divide-y divide-slate-100 p-0">
              {RECENT_ACTIVITY.map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
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
