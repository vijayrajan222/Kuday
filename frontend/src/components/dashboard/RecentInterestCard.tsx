import { memo } from 'react';

interface RecentInterestCardProps {
  name: string;
  avatarUrl?: string;
  matchScore: number;
  messageSnippet: string;
  onMessage: () => void;
  onViewProfile: () => void;
}

export const RecentInterestCard = memo(function RecentInterestCard({
  name,
  avatarUrl,
  matchScore,
  messageSnippet,
  onMessage,
  onViewProfile,
}: RecentInterestCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-11 w-11 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
            {matchScore}% Match
          </span>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">{name}</h4>
          <p className="mt-1 text-xs text-slate-600 italic line-clamp-2 leading-relaxed">
            &quot;{messageSnippet}&quot;
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onMessage}
          className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          Message
        </button>
        <button
          type="button"
          onClick={onViewProfile}
          className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
        >
          Profile
        </button>
      </div>
    </div>
  );
});
