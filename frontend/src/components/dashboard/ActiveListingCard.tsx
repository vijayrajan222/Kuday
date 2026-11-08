import { memo } from 'react';

interface ActiveListingCardProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  onManage: () => void;
  badgeText?: string;
  buttonText?: string;
}

export const ActiveListingCard = memo(function ActiveListingCard({
  title,
  subtitle,
  imageUrl,
  onManage,
  badgeText = 'Active',
  buttonText = 'Manage Listing',
}: ActiveListingCardProps) {
  const defaultImage =
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors">
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        <img
          src={imageUrl || defaultImage}
          alt={title}
          className="h-full w-full object-cover"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-xs flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {badgeText}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 capitalize">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onManage}
          className="w-full rounded-lg border border-slate-900 bg-white py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
});
