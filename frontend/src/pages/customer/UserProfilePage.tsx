import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Heart,
  Check,
  Clock,
  ArrowLeft,
  Wine,
  Moon,
  Sparkles,
  Ban,
  Quote,
  Building,
  Wifi,
  Utensils,
  Laptop,
  Car,
  Wind,
  Dog,
  Maximize,
  Shirt,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInterest } from '@/hooks/useInterest';
import { onboardingService } from '@/services/onboardingService';
import { ROUTES } from '@/constants/routes';
import { deduplicateAmenities, type FormattedAmenity } from '@/utils/amenitiesHelper';
import type { RoomEntity, SeekerPreferenceEntity } from '@/types/onboarding.types';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [lifestyle, setLifestyle] = useState<any>(null);
  const [hostRoom, setHostRoom] = useState<RoomEntity | null>(null);
  const [seekerPref, setSeekerPref] = useState<SeekerPreferenceEntity | null>(null);

  // Interest hook for connection status and actions
  const {
    processingId,
    sendInterest,
    getInterestStatus,
  } = useInterest(currentUser?.id);

  // Fetch target user public profile
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    setLoading(true);

    // Try unified public profile first
    onboardingService
      .getPublicProfile(userId, currentUser?.id)
      .then((data) => {
        if (!isMounted) return;
        if (data?.user) {
          setTargetUser(data.user);
          setLifestyle(data.lifestyle);
          setHostRoom(data.room || null);
          setSeekerPref(data.seekerPreference || null);
          setLoading(false);
          return;
        }
      })
      .catch(() => {
        // Fallback: fetch pieces individually
        Promise.allSettled([
          onboardingService.getUserProfile(userId),
          onboardingService.getLifestyle(userId),
          onboardingService.getRooms({ hostId: userId }),
          onboardingService.getSeekerPreferences(userId),
        ]).then(([uRes, lRes, rRes, sRes]) => {
          if (!isMounted) return;
          if (uRes.status === 'fulfilled' && uRes.value) {
            setTargetUser(uRes.value);
          }
          if (lRes.status === 'fulfilled' && lRes.value) {
            setLifestyle(lRes.value);
          }
          if (rRes.status === 'fulfilled' && Array.isArray(rRes.value) && rRes.value.length > 0) {
            setHostRoom(rRes.value[0]);
          }
          if (sRes.status === 'fulfilled' && sRes.value) {
            const pref = Array.isArray(sRes.value) ? sRes.value[0] : sRes.value;
            setSeekerPref(pref || null);
          }
          setLoading(false);
        });
      });

    return () => {
      isMounted = false;
    };
  }, [userId, currentUser?.id]);

  const isHost = targetUser?.role === 'host' || Boolean(hostRoom);
  const fullName = targetUser
    ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || 'User Profile'
    : 'User Profile';

  // Interest target id is room id if host with room, or seeker pref id if seeker, or user id
  const targetId = isHost ? (hostRoom?.id || userId || '') : (seekerPref?.id || userId || '');
  const interestStatus = getInterestStatus(targetId, userId || '');

  const handleSendInterestAction = useCallback(async () => {
    if (!userId || !currentUser?.id) return;
    await sendInterest(
      {
        senderId: currentUser.id,
        receiverId: userId,
        targetType: isHost ? 'room' : 'seeker',
        targetId,
      },
      fullName
    );
  }, [userId, currentUser?.id, isHost, targetId, fullName, sendInterest]);

  // Deduplicated & normalized amenities
  const displayedAmenities: FormattedAmenity[] = useMemo(() => {
    let rawList: string[] = [];
    if (isHost) {
      if (hostRoom?.amenities && hostRoom.amenities.length > 0) {
        rawList = hostRoom.amenities;
      } else {
        rawList = ['wifi', 'laundry', 'kitchen', 'balcony', 'gym', 'workspace'];
      }
    } else {
      if (seekerPref?.requiredAmenities && seekerPref.requiredAmenities.length > 0) {
        rawList = seekerPref.requiredAmenities;
      } else {
        rawList = ['wifi', 'laundry', 'kitchen', 'workspace', 'parking'];
      }
    }
    return deduplicateAmenities(rawList);
  }, [isHost, hostRoom?.amenities, seekerPref?.requiredAmenities]);

  const renderAmenityIcon = (iconName: FormattedAmenity['iconName']) => {
    switch (iconName) {
      case 'wifi':
        return <Wifi className="h-4 w-4 text-slate-700" />;
      case 'laundry':
        return <Shirt className="h-4 w-4 text-slate-700" />;
      case 'kitchen':
        return <Utensils className="h-4 w-4 text-slate-700" />;
      case 'gym':
        return <Building className="h-4 w-4 text-slate-700" />;
      case 'workspace':
        return <Laptop className="h-4 w-4 text-slate-700" />;
      case 'parking':
        return <Car className="h-4 w-4 text-slate-700" />;
      case 'ac':
        return <Wind className="h-4 w-4 text-slate-700" />;
      case 'pet':
        return <Dog className="h-4 w-4 text-slate-700" />;
      default:
        return <Maximize className="h-4 w-4 text-slate-700" />;
    }
  };

  // Lifestyle normalized labels
  const smokingLabel = useMemo(() => {
    const s = lifestyle?.smoking?.toLowerCase();
    if (s === 'never' || !s) return 'Non-smoker';
    if (s === 'occasionally' || s === 'socially') return 'Occasional';
    return 'Smoker';
  }, [lifestyle?.smoking]);

  const drinkingLabel = useMemo(() => {
    const d = lifestyle?.drinking?.toLowerCase();
    if (d === 'never') return 'Non-drinker';
    if (d === 'regularly') return 'Regular';
    if (!d) return 'Occasional';
    return d.charAt(0).toUpperCase() + d.slice(1);
  }, [lifestyle?.drinking]);

  const sleepLabel = useMemo(() => {
    const sl = lifestyle?.sleepSchedule?.toLowerCase();
    if (sl === 'early_bird' || sl === 'early') return 'Early Bird';
    if (sl === 'night_owl') return 'Night Owl';
    return 'Flexible';
  }, [lifestyle?.sleepSchedule]);

  const cleanlinessLabel = useMemo(() => {
    const c = lifestyle?.cleanliness?.toLowerCase();
    if (c === 'spotless' || c === 'very_clean') return 'Spotless';
    if (c === 'clean') return 'Clean';
    return 'Moderate';
  }, [lifestyle?.cleanliness]);

  // Philosophy quote
  const philosophyText = useMemo(() => {
    if (isHost) {
      return (
        targetUser?.bio ||
        "I believe home is where we recharge. I strive to provide a space that is as functional as it is beautiful, ensuring every roommate feels both independent and welcomed."
      );
    }
    return (
      targetUser?.bio ||
      "I value open communication, quiet evenings, and a collaborative living space where everyone feels respected and at home."
    );
  }, [isHost, targetUser?.bio]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        <p className="text-xs text-slate-500 font-medium">Loading profile details...</p>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">User Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested profile does not exist or may have been deactivated.
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Breadcrumb Navigation */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Card & Verification Card */}
        <div className="lg:col-span-4 space-y-4">
          {/* Main User Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-5 text-center">
            {/* Square/Rounded Profile Image with Verified Badge */}
            <div className="relative mx-auto w-44 h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
              {targetUser.selfieUrl ? (
                <img
                  src={targetUser.selfieUrl}
                  alt={fullName}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-4xl">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
              {targetUser.identityVerified && (
                <span
                  title="Verified User"
                  className="absolute bottom-2.5 right-2.5 rounded-full bg-sky-500 text-white p-1 border-2 border-white shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              )}
            </div>

            {/* Name & Occupation */}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{fullName}</h1>
              <p className="text-xs font-semibold text-slate-500 capitalize mt-0.5">
                {targetUser.occupation?.replace(/_/g, ' ') || (isHost ? 'Architectural Designer' : 'Room Seeker')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
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
                  disabled={processingId === targetId}
                  onClick={handleSendInterestAction}
                  className="w-full py-3.5 rounded-xl bg-black text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                >
                  <Heart className="h-4 w-4" />
                  <span>{processingId === targetId ? 'Sending...' : 'Send Interest'}</span>
                </button>
              )}

              {/* Secondary Button: View Listings (for Host) or View Matches (for Seeker) */}
              {isHost && hostRoom ? (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ROOM_DETAILS.replace(':roomId', hostRoom.id))}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  View Listings
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>

          {/* 100% Verified Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">100% Verified</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Identity, Employment, and Background Check completed on Oct 2023.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: About Me, Lifestyle & Habits, Amenities, Philosophy */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section 1: About Me */}
          <div className="space-y-3 pb-6 border-b border-slate-200/80">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">About Me</h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                Hi, I&apos;m {targetUser.firstName}! I&apos;m an{' '}
                {targetUser.occupation?.replace(/_/g, ' ') || 'architectural designer'} currently working
                in the local area. I&apos;m passionate about clean lines, intentional living spaces, and
                harmonious living. I value a home that feels like a sanctuary—calm, organized, and filled with
                natural light.
              </p>
              <p>
                {isHost
                  ? "I've been hosting and love meeting professionals who appreciate a quiet, aesthetic environment. When I'm not working, you can find me visiting galleries or trying out new espresso bars."
                  : "I'm looking for a respectful and clean home environment with like-minded individuals who value personal space and quiet evenings."}
              </p>
            </div>
          </div>

          {/* Section 2: Lifestyle & Habits */}
          <div className="space-y-4 pb-6 border-b border-slate-200/80">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lifestyle &amp; Habits</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Smoking Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center space-y-2 shadow-2xs">
                <Ban className="h-5 w-5 mx-auto text-slate-400" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Smoking
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">{smokingLabel}</p>
                </div>
              </div>

              {/* Drinking Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center space-y-2 shadow-2xs">
                <Wine className="h-5 w-5 mx-auto text-slate-400" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Drinking
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">{drinkingLabel}</p>
                </div>
              </div>

              {/* Sleep Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center space-y-2 shadow-2xs">
                <Moon className="h-5 w-5 mx-auto text-slate-400" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sleep
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">{sleepLabel}</p>
                </div>
              </div>

              {/* Cleanliness Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center space-y-2 shadow-2xs">
                <Sparkles className="h-5 w-5 mx-auto text-slate-400" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cleanliness
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">{cleanlinessLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Amenities Offered (for Host) OR Amenities Preferred (for Seeker) */}
          <div className="space-y-4 pb-6 border-b border-slate-200/80">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isHost ? 'Amenities Offered' : 'Amenities Preferred'}
            </h2>

            <div className="flex flex-wrap gap-2.5">
              {displayedAmenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs flex items-center gap-2.5 text-xs font-semibold text-slate-800"
                >
                  {renderAmenityIcon(amenity.iconName)}
                  <span>{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Philosophy Quote */}
          <div className="rounded-3xl border border-slate-200/90 bg-slate-50/70 p-6 sm:p-8 relative shadow-2xs space-y-3">
            <Quote className="h-10 w-10 text-slate-300 absolute top-6 right-6 pointer-events-none" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {isHost ? 'Hosting Philosophy' : 'Roommate Philosophy'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic pr-8">
              &quot;{philosophyText}&quot;
            </p>
          </div>

          {/* Section 5: If Host has a Room, provide Active Room Listing preview */}
          {isHost && hostRoom && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Active Space Offered by {targetUser.firstName}
              </h3>
              <div
                onClick={() => navigate(ROUTES.ROOM_DETAILS.replace(':roomId', hostRoom.id))}
                className="group cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-center gap-4"
              >
                <div className="h-24 w-full sm:w-36 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {hostRoom.images && hostRoom.images.length > 0 ? (
                    <img
                      src={hostRoom.images[0]}
                      alt={hostRoom.title || 'Room listing'}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                      Listing Photo
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm group-hover:underline">
                      {hostRoom.title || hostRoom.roomType.replace(/_/g, ' ')}
                    </h4>
                    <span className="text-xs font-extrabold text-slate-900">
                      ₹{hostRoom.monthlyRent}/mo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {hostRoom.location}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                    {hostRoom.availabilityNotes || 'Available for verified roommates.'}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:underline">
                    View Space <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
