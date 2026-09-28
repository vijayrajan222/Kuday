import { useCallback, useMemo } from 'react';
import { Clock, Search } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { MatchCard } from '@/components/roommate/MatchCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { DASHBOARD_STATS, RECENT_ACTIVITY, ROOMMATE_MATCHES } from '@/data/dummyData';

export default function CustomerDashboard() {
  const firstName = useAuth().user?.firstName;

  // sorted once, not on every render
  const matches = useMemo(() => [...ROOMMATE_MATCHES].sort((a, b) => b.matchPercent - a.matchPercent), []);

  const handleConnect = useCallback((id: string) => {
    const match = ROOMMATE_MATCHES.find((m) => m.id === id);
    toast.info(`Connect request sent to ${match?.name ?? 'roommate'} (demo)`);
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-xl">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome{firstName ? `, ${firstName}` : ''} 👋</h1>
          <p className="mt-2 text-emerald-50">
            This is a placeholder dashboard. Your matches, listings and messages will show up here soon.
          </p>
          <Button variant="secondary" className="mt-5" leftIcon={<Search className="h-4 w-4" />} disabled>
            Find Roommates (coming soon)
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STATS.map((stat) => (
          <StatCard key={stat.id} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} />
        ))}
      </section>

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
    </div>
  );
}
