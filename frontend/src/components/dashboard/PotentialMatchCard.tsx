import { memo } from 'react';
import { MapPin, Sparkles, CheckCircle2, Eye, Heart, Check, Clock } from 'lucide-react';

interface PotentialMatchCardProps {
  id: string;
  name: string;
  location: string;
  priceOrBudget: string;
  priceLabel?: string;
  badgeTag: string;
  occupationOrType?: string;
  imageUrl?: string;
  matchScore: number;
  isVerified?: boolean;
  status?: 'accepted' | 'pending' | 'declined' | 'received_pending' | 'none' | null;
  isProcessing?: boolean;
  onDetails: () => void;
  onAction: () => void;
}

export const PotentialMatchCard = memo(function PotentialMatchCard({
  name,
  location,
  priceOrBudget,
  priceLabel = '/mo',
  badgeTag,
  occupationOrType,
  imageUrl,
  matchScore,
  isVerified,
  status,
  isProcessing,
  onDetails,
  onAction,
}: PotentialMatchCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
      <div>
        {/* Photo header with overlay badges */}
        <div
          onClick={onDetails}
          className="relative h-56 w-full bg-slate-100 cursor-pointer overflow-hidden"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 font-bold text-2xl">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Match Score Badge */}
          <span className="absolute top-3 left-3 rounded-full bg-slate-900/80 backdrop-blur px-2.5 py-1 text-xs font-bold text-white shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {matchScore}% Match
          </span>

          {/* Verified Badge */}
          {isVerified && (
            <span className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold shadow-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
            </span>
          )}

          {/* Hover View overlay */}
          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
            <Eye className="w-4 h-4" /> View Full Profile
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-900 text-base leading-snug capitalize">
                {name}
              </h4>
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[160px]">{location}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-extrabold text-slate-900">{priceOrBudget}</span>
              <span className="text-[10px] text-slate-400 block">{priceLabel}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-[11px] text-slate-700 capitalize">
              {badgeTag}
            </span>
            {occupationOrType && (
              <span className="text-slate-500 text-[11px] capitalize truncate max-w-[120px]">
                {occupationOrType}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="p-4 pt-0">
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onDetails}
            className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Details
          </button>

          {status === 'accepted' ? (
            <button
              type="button"
              disabled
              className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 py-2 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1"
            >
              <Check className="h-3.5 w-3.5 text-emerald-600" /> Connected
            </button>
          ) : status === 'pending' ? (
            <button
              type="button"
              disabled
              className="flex-1 rounded-lg bg-amber-50 border border-amber-200 py-2 text-xs font-semibold text-amber-800 flex items-center justify-center gap-1"
            >
              <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending
            </button>
          ) : status === 'received_pending' ? (
            <button
              type="button"
              onClick={onAction}
              className="flex-1 rounded-lg bg-blue-50 border border-blue-200 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
            >
              <Heart className="h-3.5 w-3.5 text-blue-600" /> Respond
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessing}
              onClick={onAction}
              className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Heart className="h-3.5 w-3.5" />
              {isProcessing ? 'Sending...' : 'Send Interest'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
