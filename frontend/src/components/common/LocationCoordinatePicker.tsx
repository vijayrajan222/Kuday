import React, { useState } from 'react';
import {
  MapPin,
  Crosshair,
  Compass,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/useToast';

export interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationCoordinatePickerProps {
  location: string;
  onLocationChange: (loc: string) => void;
  coordinates?: Coordinates | null;
  onCoordinatesChange: (coords: Coordinates | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const CITY_PRESETS: { name: string; lat: number; lng: number }[] = [
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
];

export function LocationCoordinatePicker({
  location,
  onLocationChange,
  coordinates,
  onCoordinatesChange,
  label = 'Property Location & Map Coordinates',
  required = true,
  disabled = false,
}: LocationCoordinatePickerProps) {
  const [detectingGps, setDetectingGps] = useState(false);
  const [latInput, setLatInput] = useState<string>(
    coordinates?.lat !== undefined ? String(coordinates.lat) : ''
  );
  const [lngInput, setLngInput] = useState<string>(
    coordinates?.lng !== undefined ? String(coordinates.lng) : ''
  );

  // Sync internal input state when coordinates prop changes externally
  React.useEffect(() => {
    if (coordinates?.lat !== undefined) {
      setLatInput(String(coordinates.lat));
    } else {
      setLatInput('');
    }
    if (coordinates?.lng !== undefined) {
      setLngInput(String(coordinates.lng));
    } else {
      setLngInput('');
    }
  }, [coordinates?.lat, coordinates?.lng]);

  const handleLatChange = (val: string) => {
    setLatInput(val);
    const num = Number(val);
    if (val.trim() === '' || isNaN(num)) {
      if (coordinates) {
        onCoordinatesChange(null);
      }
      return;
    }
    if (num >= -90 && num <= 90) {
      const currentLng = Number(lngInput);
      if (!isNaN(currentLng) && lngInput.trim() !== '') {
        onCoordinatesChange({ lat: num, lng: currentLng });
      }
    }
  };

  const handleLngChange = (val: string) => {
    setLngInput(val);
    const num = Number(val);
    if (val.trim() === '' || isNaN(num)) {
      if (coordinates) {
        onCoordinatesChange(null);
      }
      return;
    }
    if (num >= -180 && num <= 180) {
      const currentLat = Number(latInput);
      if (!isNaN(currentLat) && latInput.trim() !== '') {
        onCoordinatesChange({ lat: currentLat, lng: num });
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingGps(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatInput(String(lat));
        setLngInput(String(lng));
        onCoordinatesChange({ lat, lng });

        toast.success(
          `Location detected! Latitude: ${lat}, Longitude: ${lng}`
        );
      },
      (error) => {
        setDetectingGps(false);
        let msg = 'Failed to acquire GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please enter coordinates manually or choose a preset city.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again or enter manually.';
        }
        toast.error(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSelectPreset = (preset: { name: string; lat: number; lng: number }) => {
    setLatInput(String(preset.lat));
    setLngInput(String(preset.lng));
    onCoordinatesChange({ lat: preset.lat, lng: preset.lng });
    if (!location.trim()) {
      onLocationChange(preset.name);
    }
    toast.info(`Coordinates set for ${preset.name}`);
  };

  const handleClearCoordinates = () => {
    setLatInput('');
    setLngInput('');
    onCoordinatesChange(null);
  };

  const hasValidCoordinates =
    coordinates &&
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng);

  const previewQuery = hasValidCoordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : location.trim()
    ? encodeURIComponent(location.trim())
    : '';

  const testNavUrl = hasValidCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`
    : location.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`
    : '#';

  return (
    <div className="space-y-4">
      {/* 1. Address / Locality Name */}
      <div className="space-y-1.5">
        <Label htmlFor="property-location" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </span>
          {hasValidCoordinates && (
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Coordinates Marked
            </span>
          )}
        </Label>
        <Input
          id="property-location"
          type="text"
          placeholder="e.g. Indiranagar, Bengaluru or MG Road, Kochi"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          disabled={disabled}
          className="text-xs"
          required={required}
        />
        <p className="text-[11px] text-slate-500">
          Enter city name, street, or neighborhood. Specify coordinates below for exact map navigation.
        </p>
      </div>

      {/* 2. Coordinates Inputs & GPS Quick Action */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Compass className="h-4 w-4 text-indigo-600" />
            <span>Exact Coordinates (Latitude &amp; Longitude)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={detectingGps || disabled}
              className="text-xs h-7 px-2.5 bg-white border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-500"
              leftIcon={<Crosshair className={`h-3.5 w-3.5 ${detectingGps ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />}
            >
              {detectingGps ? 'Detecting...' : 'Use Current GPS'}
            </Button>

            {hasValidCoordinates && (
              <button
                type="button"
                onClick={handleClearCoordinates}
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 px-1.5 py-0.5"
                title="Clear coordinates"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Lat & Lng Input Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600 block">
              Latitude (-90 to 90)
            </label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 12.9716"
              value={latInput}
              onChange={(e) => handleLatChange(e.target.value)}
              disabled={disabled}
              className="text-xs font-mono h-8 bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600 block">
              Longitude (-180 to 180)
            </label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 77.5946"
              value={lngInput}
              onChange={(e) => handleLngChange(e.target.value)}
              disabled={disabled}
              className="text-xs font-mono h-8 bg-white"
            />
          </div>
        </div>

        {/* Quick City Presets */}
        <div className="pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Quick City Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CITY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                disabled={disabled}
                className="rounded-lg bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Interactive Map Preview Canvas */}
      {previewQuery ? (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-800">
                {hasValidCoordinates
                  ? `Pin: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                  : location}
              </span>
            </div>

            <a
              href={testNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              <span>Test Navigation</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="relative h-44 w-full bg-slate-200">
            <iframe
              title="Location Map Preview"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${previewQuery}&z=14&output=embed`}
            />
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-dashed border-slate-300 text-center bg-slate-50/50 space-y-1">
          <AlertCircle className="h-5 w-5 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600 font-medium">No coordinates or location entered yet</p>
          <p className="text-[11px] text-slate-400">
            Click &quot;Use Current GPS&quot;, choose a city preset, or enter coordinates manually to enable navigation.
          </p>
        </div>
      )}
    </div>
  );
}
