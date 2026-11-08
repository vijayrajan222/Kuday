import { memo } from 'react';
import { User, Home, Plus } from 'lucide-react';

interface ActiveListingCardProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  fallbackInitial?: string;
  onManage: () => void;
  badgeText?: string;
  buttonText?: string;
  isActive?: boolean;
}

export const ActiveListingCard = memo(function ActiveListingCard({
  title,
  subtitle,
  imageUrl,
  fallbackInitial,
  onManage,
  badgeText = 'Active',
  buttonText = 'Manage Listing',
  isActive = true,
}: ActiveListingCardProps) {
  const isInactive = !isActive || badgeText.toLowerCase() === 'inactive';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors">
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : isInactive ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 border-b border-dashed border-slate-200 text-slate-400 p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Home className="h-6 w-6 text-slate-400" />
            </div>
            <span className="text-xs font-semibold text-slate-600">No Listing Posted</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Click below to add a property</span>
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4">
            {fallbackInitial ? (
              <span className="text-3xl font-extrabold tracking-wider text-white">
                {fallbackInitial.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="h-12 w-12 text-slate-400" />
            )}
          </div>
        )}

        {/* Status Badge */}
        {isInactive ? (
          <span className="absolute top-3 left-3 rounded-full bg-slate-100/95 border border-slate-200 backdrop-blur px-2.5 py-0.5 text-[11px] font-bold text-slate-600 shadow-xs flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {badgeText || 'Inactive'}
          </span>
        ) : (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-xs flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {badgeText}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 capitalize">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onManage}
          className={`w-full rounded-lg border py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            isInactive
              ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
              : 'border-slate-900 bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          {isInactive && <Plus className="h-3.5 w-3.5" />}
          {buttonText}
        </button>
      </div>
    </div>
  );
});
