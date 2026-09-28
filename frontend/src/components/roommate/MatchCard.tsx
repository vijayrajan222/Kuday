import { memo } from 'react';
import { Briefcase, MapPin, Wallet } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { RoommateMatch } from '@/data/dummyData';

interface MatchCardProps {
  match: RoommateMatch;
  onConnect?: (id: string) => void;
}

export const MatchCard = memo(function MatchCard({ match, onConnect }: MatchCardProps) {
  return (
    <Card className="space-y-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <Avatar name={match.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">
            {match.name}, {match.age}
          </h3>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <Briefcase className="h-3.5 w-3.5" /> {match.occupation}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          {match.matchPercent}%
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-slate-600">
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {match.location}</p>
        <p className="flex items-center gap-2"><Wallet className="h-4 w-4 text-slate-400" /> {match.budget}</p>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {match.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            {tag}
          </li>
        ))}
      </ul>

      <Button size="sm" fullWidth onClick={() => onConnect?.(match.id)}>
        Connect
      </Button>
    </Card>
  );
});
