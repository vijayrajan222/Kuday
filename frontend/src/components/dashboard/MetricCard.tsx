import { memo } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
}

export const MetricCard = memo(function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs hover:border-slate-300 transition-colors">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
        {label}
      </span>
      <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
        {value}
      </p>
    </div>
  );
});
