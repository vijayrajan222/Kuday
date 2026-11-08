import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Wifi,
  Dumbbell,
  Dog,
  Shield,
  Ban,
  VolumeX,
  Clock,
  CheckCircle2,
  Heart,
  Check,
  ArrowLeft,
  Car,
  Utensils,
  Laptop,
  Wine,
  Building,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInterest } from '@/hooks/useInterest';
import { onboardingService } from '@/services/onboardingService';
import { ROUTES } from '@/constants/routes';
import type { RoomEntity } from '@/types/onboarding.types';

export default function RoomDetailsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<RoomEntity | null>(null);
  const [loading, setLoading] = useState(true);

  // Interest hook for sending/checking interest status
  const {
    processingId,
    sendInterest,
    getInterestStatus,
  } = useInterest(user?.id);

  // Fetch room details by id
  useEffect(() => {
    if (!roomId) return;
    let isMounted = true;
    setLoading(true);

    onboardingService
      .getRoomById(roomId, user?.id)
      .then((data) => {
        if (isMounted) {
          setRoom(data);
          setLoading(false);
        }
      })
      .catch(() => {
        // Fallback: try fetching from all rooms if endpoint not ready
        onboardingService
          .getRooms({ userId: user?.id })
          .then((all) => {
            if (isMounted) {
              const found = all?.find((r: RoomEntity) => r.id === roomId);
              setRoom(found || null);
              setLoading(false);
            }
          })
          .catch(() => {
            if (isMounted) setLoading(false);
          });
      });

    return () => {
      isMounted = false;
    };
  }, [roomId, user?.id]);

  const hostUserId = room?.hostId || room?.host?.id || '';
  const hostName = room?.host
    ? `${room.host.firstName} ${room.host.lastName || ''}`.trim()
    : 'Property Host';
  const interestStatus = getInterestStatus(room?.id || '', hostUserId);

  const handleSendInterestAction = useCallback(async () => {
    if (!room || !user?.id || !hostUserId) return;
    await sendInterest(
      {
        senderId: user.id,
        receiverId: hostUserId,
        targetType: 'room',
        targetId: room.id,
      },
      hostName
    );
  }, [room, user?.id, hostUserId, hostName, sendInterest]);

  // Gallery photos with high quality fallback interior shots
  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (room?.images && room.images.length > 0) {
      list.push(...room.images);
    }
    const fallbacks = [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    ];
    for (const fb of fallbacks) {
      if (list.length < 5) list.push(fb);
    }
    return list;
  }, [room?.images]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading room details...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Room Not Found</h2>
        <p className="text-xs text-slate-500">
          The property listing you requested could not be found or has been unlisted.
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const matchPercent = room.matchPercentage ?? 92;

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </button>
      </div>

      {/* 1. Photo Gallery Grid (Large left, 2x2 grid right) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5 rounded-3xl overflow-hidden border border-slate-200/80 bg-white p-2 shadow-2xs">
        {/* Large Main Photo */}
        <div className="relative h-[320px] sm:h-[440px] w-full rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={galleryImages[0]}
            alt={room.title || 'Room main photo'}
            className="h-full w-full object-cover"
          />
        </div>

        {/* 2x2 Right Photos */}
        <div className="grid grid-cols-2 gap-3.5 h-[320px] sm:h-[440px]">
          <div className="relative rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={galleryImages[1]}
              alt="Room view 2"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={galleryImages[2]}
              alt="Room view 3"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={galleryImages[3]}
              alt="Room view 4"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={galleryImages[4]}
              alt="Room view 5"
              className="h-full w-full object-cover"
            />
            {galleryImages.length > 5 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold backdrop-blur-[2px]">
                +{galleryImages.length - 4} photos
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Main Content & Sticky Host Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column (Room Details) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Price Header */}
          <div className="space-y-3 pb-6 border-b border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
                  {room.title || room.roomType.replace('_', ' ')}
                </h1>
                <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{room.location}</span>
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  ₹{room.monthlyRent}
                </span>
                <span className="text-xs text-slate-400 font-medium">/mo</span>
              </div>
            </div>
          </div>

          {/* About the Room */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">About the Room</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {room.description ||
                'Designed with attention to detail and modern comfort, this space offers an unparalleled living experience. Featuring high-grade fixtures, ambient natural light, and quiet shared spaces.'}
            </p>
            {room.availabilityNotes && (
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <strong className="text-slate-700">Availability Note:</strong>{' '}
                {room.availabilityNotes}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Capacity: <strong className="text-slate-700">{room.capacity} Person(s)</strong>
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-center space-y-2">
                <Wifi className="h-5 w-5 mx-auto text-slate-700" />
                <span className="text-xs font-semibold text-slate-800 block">High-speed WiFi</span>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-center space-y-2">
                <Dog className="h-5 w-5 mx-auto text-slate-700" />
                <span className="text-xs font-semibold text-slate-800 block">Pet Friendly</span>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-center space-y-2">
                <Dumbbell className="h-5 w-5 mx-auto text-slate-700" />
                <span className="text-xs font-semibold text-slate-800 block">Fitness / Gym</span>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-center space-y-2">
                <Building className="h-5 w-5 mx-auto text-slate-700" />
                <span className="text-xs font-semibold text-slate-800 block">Elevator / Concierge</span>
              </div>
              {room.amenities?.map((amenity, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center space-y-2 shadow-2xs"
                >
                  {amenity.includes('wifi') ? (
                    <Wifi className="h-5 w-5 mx-auto text-emerald-600" />
                  ) : amenity.includes('parking') ? (
                    <Car className="h-5 w-5 mx-auto text-emerald-600" />
                  ) : amenity.includes('kitchen') ? (
                    <Utensils className="h-5 w-5 mx-auto text-emerald-600" />
                  ) : amenity.includes('workspace') ? (
                    <Laptop className="h-5 w-5 mx-auto text-emerald-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600" />
                  )}
                  <span className="text-xs font-semibold text-slate-800 capitalize block">
                    {amenity.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-slate-900">House Rules</h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Ban className="h-4 w-4 text-rose-500 shrink-0" />
                <span>
                  No smoking inside the premises (Smoking policy:{' '}
                  <strong className="capitalize">
                    {room.host?.lifestyle?.smoking || 'Never'}
                  </strong>
                  )
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Wine className="h-4 w-4 text-rose-500 shrink-0" />
                <span>
                  No loud parties or disturbances (Drinking policy:{' '}
                  <strong className="capitalize">
                    {room.host?.lifestyle?.drinking || 'Socially'}
                  </strong>
                  )
                </span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Quiet hours observed after 10:00 PM (Sleep schedule:{' '}
                  <strong className="capitalize">
                    {room.host?.lifestyle?.sleepSchedule || 'Flexible'}
                  </strong>
                  )
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Visitor Policy:{' '}
                  <strong className="capitalize">
                    {room.host?.lifestyle?.visitorPolicy || 'Flexible'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Location Map Placeholder */}
          <div className="space-y-3 pt-2">
            <h2 className="text-lg font-bold text-slate-900">Location</h2>
            <div className="relative h-64 w-full rounded-3xl bg-slate-100 border border-slate-200/90 overflow-hidden flex items-center justify-center">
              {/* Map stylized background grid */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg animate-bounce">
                  <MapPin className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 bg-white/95 px-3 py-1 rounded-full shadow-2xs border border-slate-200">
                  {room.location}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              The exact address is provided after mutual connection and initial screening.
            </p>
          </div>
        </div>

        {/* Right Column: Sticky Host & Match Card */}
        <div className="sticky top-24 space-y-4">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
            {/* Host Profile Header */}
            <div className="text-center space-y-3">
              <div className="relative mx-auto h-20 w-20">
                {room.host?.selfieUrl ? (
                  <img
                    src={room.host.selfieUrl}
                    alt={hostName}
                    className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-white font-black text-xl shadow-2xs">
                    {hostName.charAt(0).toUpperCase()}
                  </div>
                )}
                {room.host?.identityVerified && (
                  <span
                    title="Verified Host"
                    className="absolute bottom-0 right-0 rounded-full bg-sky-500 text-white p-1 border-2 border-white shadow-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{hostName}</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                  Host • {room.host?.occupation || 'Verified Host'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">
                &quot;
                {room.host?.bio ||
                  'Architectural designer, minimalist enthusiast. Looking for a respectful partner who appreciates silent mornings and high-end design.'}
                &quot;
              </p>
            </div>

            {/* Compatibility Box */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Compatibility
                </span>
                <span className="text-xs font-black text-sky-600">{matchPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all"
                  style={{ width: `${matchPercent}%` }}
                />
              </div>

              {/* Compatibility Highlights */}
              <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>Compatible schedule &amp; lifestyle</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>Matching cleanliness standards</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>Budget &amp; room type aligned</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>Shared visitor &amp; quiet hours policy</span>
                </li>
              </ul>
            </div>

            {/* Action Button: Send Interest / Connected / Pending */}
            <div className="space-y-3">
              {interestStatus === 'accepted' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4 text-emerald-600" /> Connected
                </button>
              ) : interestStatus === 'pending' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Clock className="h-4 w-4 text-amber-600" /> Request Pending
                </button>
              ) : interestStatus === 'received_pending' ? (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.MATCHED)}
                  className="w-full py-3 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs uppercase tracking-wider hover:bg-blue-100 flex items-center justify-center gap-1.5"
                >
                  <Heart className="h-4 w-4 text-blue-600" /> Respond in Matched
                </button>
              ) : (
                <button
                  type="button"
                  disabled={processingId === room.id}
                  onClick={handleSendInterestAction}
                  className="w-full py-3 rounded-xl bg-black text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Heart className="h-4 w-4" />
                  <span>{processingId === room.id ? 'Sending...' : 'Send Interest'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(ROUTES.MATCHED)}
                className="w-full text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition-colors block"
              >
                View Matches &amp; Requests
              </button>
            </div>

            {/* Verification Meter */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                  Verification
                </span>
                <span className="font-extrabold text-slate-900 text-xs">100%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full" />
            </div>
          </div>

          {/* Safe & Secure Banner */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-xs text-slate-600 flex items-center gap-3 shadow-2xs">
            <Shield className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="leading-snug">
              Safe &amp; secure connections with Kudai Verified Identity &amp; Protocols.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
