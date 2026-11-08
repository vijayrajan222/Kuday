import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  SunMedium,
  Moon,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { visitService } from '@/services/visitService';
import { onboardingService } from '@/services/onboardingService';
import { toast } from '@/hooks/useToast';
import type { TimeSlot, Visit } from '@/types/visit.types';

const DAYS_OF_WEEK = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const TIME_SLOTS: Array<{
  id: TimeSlot;
  label: string;
  time: string;
  icon: typeof Sun;
}> = [
  {
    id: 'morning',
    label: 'Morning',
    time: '10:00 AM',
    icon: Sun,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    time: '02:00 PM',
    icon: SunMedium,
  },
  {
    id: 'evening',
    label: 'Evening',
    time: '06:00 PM',
    icon: Moon,
  },
];

export default function ScheduleVisitPage() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Route state data passed from MatchedPage
  const stateData = (location.state as {
    hostId?: string;
    hostName?: string;
    hostAvatar?: string;
    roomId?: string;
    roomTitle?: string;
    connectionId?: string;
    availabilityNote?: string;
    isVerified?: boolean;
    occupation?: string;
  }) || {};

  const hostId = stateData.hostId || '';
  const [hostName, setHostName] = useState(stateData.hostName || 'Property Host');
  const [hostAvatar, setHostAvatar] = useState(stateData.hostAvatar || '');
  const [isVerified, setIsVerified] = useState(Boolean(stateData.isVerified));
  const [hostOccupation, setHostOccupation] = useState(stateData.occupation || 'HOST & ROOMMATE');
  const availabilityNote =
    stateData.availabilityNote ||
    'I am usually available on weekday evenings after 6 PM and anytime during weekends. Please pick a slot that works for you!';

  // If host details weren't in location.state, fetch user public profile
  useEffect(() => {
    if (hostId && (!stateData.hostName || !stateData.hostAvatar)) {
      onboardingService
        .getPublicProfile(hostId)
        .then((profile: { firstName?: string; lastName?: string; selfieUrl?: string; identityVerified?: boolean; occupation?: string } | null) => {
          if (profile) {
            setHostName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Property Host');
            if (profile.selfieUrl) setHostAvatar(profile.selfieUrl);
            if (profile.identityVerified) setIsVerified(true);
            if (profile.occupation) setHostOccupation(profile.occupation.replace('_', ' '));
          }
        })
        .catch(() => {});
    }
  }, [hostId, stateData.hostName, stateData.hostAvatar]);

  // Calendar State
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Format initial selected date (e.g., tomorrow or 3 days ahead)
  const defaultSelectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(defaultSelectedDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('afternoon');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingVisit, setExistingVisit] = useState<Visit | null>(null);

  // Load existing visits for this connection
  useEffect(() => {
    if (!connectionId) return;
    visitService
      .getVisitsByConnection(connectionId)
      .then((visits) => {
        if (visits && visits.length > 0) {
          // Look for active visits (pending, rescheduled, confirmed)
          const active = visits.find((v) => ['pending', 'rescheduled', 'confirmed'].includes(v.status));
          if (active) {
            setExistingVisit(active);
            setSelectedDate(active.date);
            setSelectedSlot(active.timeSlot);
            if (active.message) setMessage(active.message);
          }
        }
      })
      .catch(() => {});
  }, [connectionId]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthLabel = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Generate calendar grid (Monday-starting)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Sunday is 0 in JS, shift so Monday is 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dayNumber: number;
      dateString: string;
      isCurrentMonth: boolean;
      isPast: boolean;
      isSelected: boolean;
    }> = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        dateString: dateStr,
        isCurrentMonth: false,
        isPast: true,
        isSelected: false,
      });
    }

    // Current month days
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = dateStr < todayStr;
      days.push({
        dayNumber: day,
        dateString: dateStr,
        isCurrentMonth: true,
        isPast,
        isSelected: dateStr === selectedDate,
      });
    }

    // Next month padding days to fill 5 or 6 rows of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        dateString: dateStr,
        isCurrentMonth: false,
        isPast: false,
        isSelected: false,
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedDate, today]);

  // Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !connectionId) {
      toast.error('Unable to schedule visit: User or connection not identified.');
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a visit date.');
      return;
    }

    const chosenSlot = TIME_SLOTS.find((s) => s.id === selectedSlot);
    const slotTime = chosenSlot?.time || '02:00 PM';

    const targetHostId =
      hostId && hostId !== user.id
        ? hostId
        : existingVisit && existingVisit.hostId !== user.id
        ? existingVisit.hostId
        : existingVisit && existingVisit.seekerId !== user.id
        ? existingVisit.seekerId
        : '';

    if (!targetHostId || targetHostId === user.id) {
      toast.error('Unable to schedule visit: recipient cannot be your own account.');
      return;
    }

    try {
      setIsSubmitting(true);
      await visitService.createVisit({
        connectionId,
        seekerId: user.id,
        hostId: targetHostId,
        roomId: stateData.roomId,
        date: selectedDate,
        timeSlot: selectedSlot,
        slotTime,
        message: message.trim(),
      });

      toast.success('Visit request sent to the host!');
      navigate(ROUTES.MATCHED);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to submit visit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.MATCHED)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Matches</span>
        </button>
      </div>

      {/* Page Heading */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Schedule a Visit
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Coordinate a time to see the space and meet your potential roommate.
        </p>
      </div>

      {/* Existing Visit Banner if already scheduled */}
      {existingVisit && (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3">
          <CalendarIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-blue-900 block">
              {existingVisit.status === 'confirmed'
                ? 'Visit Confirmed'
                : existingVisit.status === 'rescheduled'
                ? 'Reschedule In Discussion'
                : 'Visit Request Pending'}
            </span>
            <p className="text-blue-700 mt-0.5">
              Current scheduled time: {existingVisit.date} at {existingVisit.slotTime} ({existingVisit.timeSlot}).
              You can pick a new date and time below to send an updated request.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Left Calendar & Time Slots, Right Host Summary & Message */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Calendar & Slots) - 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* SELECT A DATE */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                SELECT A DATE
              </label>

              {/* Calendar Container */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
                {/* Month & Navigators */}
                <div className="flex items-center justify-between pb-5">
                  <h2 className="text-base font-bold text-slate-900">{monthLabel}</h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Day Abbreviations */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((item, idx) => {
                    if (!item.isCurrentMonth) {
                      return (
                        <div
                          key={idx}
                          className="h-10 sm:h-11 flex items-center justify-center text-xs font-medium text-slate-300 select-none"
                        >
                          {item.dayNumber}
                        </div>
                      );
                    }

                    if (item.isPast) {
                      return (
                        <div
                          key={idx}
                          className="h-10 sm:h-11 flex items-center justify-center text-xs font-medium text-slate-300 cursor-not-allowed select-none"
                        >
                          {item.dayNumber}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(item.dateString)}
                        className={`h-10 sm:h-11 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          item.isSelected
                            ? 'bg-black text-white font-bold shadow-md scale-105'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {item.dayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SELECT A TIME SLOT */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                SELECT A TIME SLOT
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const Icon = slot.icon;
                  const isSelected = selectedSlot === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`relative flex flex-col items-center justify-center py-5 px-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-black bg-white shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}

                      <Icon
                        className={`h-6 w-6 mb-2 ${
                          isSelected ? 'text-black' : 'text-slate-600'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-900">{slot.label}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">{slot.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (Host Availability & Message Sidebar) - 5 cols */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
              {/* Host Summary */}
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  {hostAvatar ? (
                    <img
                      src={hostAvatar}
                      alt={hostName}
                      className="h-14 w-14 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                      {hostName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isVerified && (
                    <span
                      title="Verified Identity"
                      className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white"
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-slate-900">{hostName}</h3>
                    {isVerified && <CheckCircle2 className="h-4 w-4 text-blue-600 fill-blue-600 text-white" />}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    {hostOccupation || 'HOST & ROOMMATE'}
                  </p>
                </div>
              </div>

              {/* Host Availability Note */}
              <div className="relative rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-2xl text-slate-300 font-serif leading-none select-none block mb-1">
                  &ldquo;&rdquo;
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  HOST AVAILABILITY NOTE
                </span>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  &ldquo;{availabilityNote}&rdquo;
                </p>
              </div>

              {/* Add a Message */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  ADD A MESSAGE
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself or ask a specific question about the space..."
                  maxLength={500}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden resize-none transition-colors"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Introduce yourself or request a flexible time.</span>
                  <span>{message.length}/500</span>
                </div>
              </div>

              {/* Confirm Request Button */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDate}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-black hover:bg-slate-800 disabled:opacity-50 text-white py-3.5 px-4 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Request</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400 font-medium">
                  No payment required until after the visit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
