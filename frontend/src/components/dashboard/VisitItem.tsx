import { memo } from 'react';

interface VisitItemProps {
  name: string;
  avatarUrl?: string;
  subtitle: string;
  date: string;
  time: string;
}

export const VisitItem = memo(function VisitItem({
  name,
  avatarUrl,
  subtitle,
  date,
  time,
}: VisitItemProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-10 w-10 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h4 className="text-sm font-bold text-slate-900">{name}</h4>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs font-bold text-slate-900">{date}</p>
        <p className="text-[11px] text-slate-400 font-medium">{time}</p>
      </div>
    </div>
  );
});
