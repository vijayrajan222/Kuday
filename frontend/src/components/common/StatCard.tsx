import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
}

export const StatCard = memo(function StatCard({ label, value, change, icon: Icon }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between transition hover:shadow-md">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-xs font-medium text-emerald-600">{change}</p>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon className="h-5 w-5" />
      </span>
    </Card>
  );
});
