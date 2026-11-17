import { useState } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/useToast';
import type { RoomCoordinates } from '@/types/onboarding.types';

interface HostLocationMapProps {
  location: string;
  coordinates?: RoomCoordinates | null;
  hostName?: string;
  className?: string;
  title?: string;
}

export function HostLocationMap({
  location,
  coordinates,
  hostName,
  className = '',
  title = 'Property Location & Map Navigation',
}: HostLocationMapProps) {
  const [copied, setCopied] = useState(false);

  const hasCoords =
    coordinates &&
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng);

  const destinationQuery = hasCoords
    ? `${coordinates.lat},${coordinates.lng}`
    : location
    ? encodeURIComponent(location)
    : '';

  // Google Maps Turn-by-Turn Navigation URL
  const navigationUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`
    : location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : '';

  const handleOpenNavigation = () => {
    if (!navigationUrl) {
      toast.error('Location details are unavailable.');
      return;
    }
    window.open(navigationUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyCoordinates = () => {
    if (!hasCoords) return;
    const text = `${coordinates.lat}, ${coordinates.lng}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Coordinates copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!destinationQuery) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm overflow-hidden space-y-4 ${className}`}
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{location}</span>
                {hostName && (
                  <>
                    <span>•</span>
                    <span>Hosted by {hostName}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right actions: Coordinates badge & Navigation CTA */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasCoords && (
            <button
              type="button"
              onClick={handleCopyCoordinates}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 transition cursor-pointer"
              title="Click to copy coordinates"
            >
              <Compass className="h-3.5 w-3.5 text-indigo-600" />
              <span>
                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </span>
              {copied ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3 text-slate-400" />
              )}
            </button>
          )}

          <Button
            size="sm"
            onClick={handleOpenNavigation}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Open Navigation</span>
            <ExternalLink className="h-3 w-3 opacity-80" />
          </Button>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div
        onClick={handleOpenNavigation}
        className="group relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-inner"
        title="Click to open turn-by-turn navigation in Google Maps"
      >
        <iframe
          title="Host Property Location Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          src={`https://maps.google.com/maps?q=${destinationQuery}&z=15&output=embed`}
          className="pointer-events-none group-hover:opacity-95 transition-opacity"
        />

        {/* Hover / Tap Overlay Banner */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-center justify-between text-white text-xs opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold drop-shadow">
              {hasCoords ? 'Exact Pin Location' : location}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-md px-3 py-1 font-bold text-xs tracking-wide hover:bg-white/30 transition-all">
            <Navigation className="h-3.5 w-3.5 text-emerald-300" />
            <span>Tap to Navigate</span>
          </span>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>Click the map or navigation button to launch turn-by-turn directions.</span>
        {hasCoords && (
          <span className="text-emerald-700 font-medium">GPS Verified Pin</span>
        )}
      </div>
    </div>
  );
}
