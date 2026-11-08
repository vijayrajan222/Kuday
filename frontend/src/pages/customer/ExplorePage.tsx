import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowLeft,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInterest } from '@/hooks/useInterest';
import { onboardingService } from '@/services/onboardingService';
import { PotentialMatchCard } from '@/components/dashboard/PotentialMatchCard';
import { ROUTES } from '@/constants/routes';
import type { RoomEntity, SeekerPreferenceEntity } from '@/types/onboarding.types';

interface ExplorePageProps {
  defaultTab?: 'rooms' | 'seekers';
}

export default function ExplorePage({ defaultTab }: ExplorePageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const userRole = (user?.role as 'host' | 'seeker') || 'seeker';
  const initialTab =
    defaultTab ||
    (searchParams.get('tab') as 'rooms' | 'seekers') ||
    (userRole === 'host' ? 'seekers' : 'rooms');

  const [activeTab, setActiveTab] = useState<'rooms' | 'seekers'>(initialTab);

  // Data states
  const [rooms, setRooms] = useState<RoomEntity[]>([]);
  const [seekers, setSeekers] = useState<SeekerPreferenceEntity[]>([]);
  const [loading, setLoading] = useState(true);

  // Interest hook
  const { getInterestStatus, sendInterest, processingId } = useInterest(user?.id);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [pricePreset, setPricePreset] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'priceAsc' | 'priceDesc' | 'newest'>('match');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Pagination states (12 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Sync tab with URL
  const handleTabChange = (tab: 'rooms' | 'seekers') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchParams({ tab });
  };

  // Load Data
  const loadExploreData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsData, seekersData] = await Promise.all([
        onboardingService.getRooms({ userId: user?.id }),
        onboardingService.getSeekerPreferences(user?.id),
      ]);
      setRooms(roomsData || []);
      setSeekers(seekersData || []);
    } catch (err) {
      console.error('Failed to load explore data', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadExploreData();
  }, [loadExploreData]);

  // Unique locations for dropdown
  const availableLocations = useMemo(() => {
    const list = activeTab === 'rooms' ? rooms : seekers;
    const locs = new Set<string>();
    list.forEach((item) => {
      const loc = 'location' in item ? item.location : item.preferredLocation;
      if (loc && loc.trim()) locs.add(loc.trim());
    });
    return Array.from(locs).sort();
  }, [activeTab, rooms, seekers]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedRoomType !== 'all') count++;
    if (selectedLocation !== 'all') count++;
    if (pricePreset !== 'all') count++;
    if (verifiedOnly) count++;
    return count;
  }, [selectedRoomType, selectedLocation, pricePreset, verifiedOnly]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRoomType('all');
    setSelectedLocation('all');
    setPricePreset('all');
    setVerifiedOnly(false);
    setSortBy('match');
    setCurrentPage(1);
  };

  // Filter & Sort Rooms
  const filteredRooms = useMemo(() => {
    if (activeTab !== 'rooms') return [];
    let list = [...rooms];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.roomType?.toLowerCase().includes(q) ||
          r.host?.firstName?.toLowerCase().includes(q) ||
          r.host?.lastName?.toLowerCase().includes(q)
      );
    }

    if (selectedRoomType !== 'all') {
      list = list.filter((r) => r.roomType === selectedRoomType);
    }

    if (selectedLocation !== 'all') {
      list = list.filter((r) => r.location?.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    if (verifiedOnly) {
      list = list.filter((r) => Boolean(r.host?.identityVerified));
    }

    if (pricePreset === 'under15k') {
      list = list.filter((r) => r.monthlyRent <= 15000);
    } else if (pricePreset === '15k-30k') {
      list = list.filter((r) => r.monthlyRent >= 15000 && r.monthlyRent <= 30000);
    } else if (pricePreset === '30k-50k') {
      list = list.filter((r) => r.monthlyRent >= 30000 && r.monthlyRent <= 50000);
    } else if (pricePreset === 'above50k') {
      list = list.filter((r) => r.monthlyRent > 50000);
    }

    if (sortBy === 'priceAsc') {
      list.sort((a, b) => a.monthlyRent - b.monthlyRent);
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => b.monthlyRent - a.monthlyRent);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } else {
      list.sort((a, b) => (b.matchPercentage ?? 85) - (a.matchPercentage ?? 85));
    }

    return list;
  }, [activeTab, rooms, searchQuery, selectedRoomType, selectedLocation, verifiedOnly, pricePreset, sortBy]);

  // Filter & Sort Seekers
  const filteredSeekers = useMemo(() => {
    if (activeTab !== 'seekers') return [];
    let list = [...seekers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.preferredLocation?.toLowerCase().includes(q) ||
          s.roomTypePreference?.toLowerCase().includes(q) ||
          s.seeker?.firstName?.toLowerCase().includes(q) ||
          s.seeker?.lastName?.toLowerCase().includes(q) ||
          s.seeker?.occupation?.toLowerCase().includes(q) ||
          s.seeker?.bio?.toLowerCase().includes(q)
      );
    }

    if (selectedRoomType !== 'all') {
      list = list.filter((s) => s.roomTypePreference === selectedRoomType);
    }

    if (selectedLocation !== 'all') {
      list = list.filter((s) => s.preferredLocation?.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    if (verifiedOnly) {
      list = list.filter((s) => Boolean(s.seeker?.identityVerified));
    }

    if (pricePreset === 'under15k') {
      list = list.filter((s) => s.maxBudget <= 15000);
    } else if (pricePreset === '15k-30k') {
      list = list.filter((s) => s.maxBudget >= 15000 && s.maxBudget <= 30000);
    } else if (pricePreset === '30k-50k') {
      list = list.filter((s) => s.maxBudget >= 30000 && s.maxBudget <= 50000);
    } else if (pricePreset === 'above50k') {
      list = list.filter((s) => s.maxBudget > 50000);
    }

    if (sortBy === 'priceAsc') {
      list.sort((a, b) => a.maxBudget - b.maxBudget);
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => b.maxBudget - a.maxBudget);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } else {
      list.sort((a, b) => (b.matchPercentage ?? 85) - (a.matchPercentage ?? 85));
    }

    return list;
  }, [activeTab, seekers, searchQuery, selectedRoomType, selectedLocation, verifiedOnly, pricePreset, sortBy]);

  const activeList = activeTab === 'rooms' ? filteredRooms : filteredSeekers;
  const totalItems = activeList.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  // Paginated window
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return activeList.slice(startIndex, startIndex + PAGE_SIZE);
  }, [activeList, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendInterest = (targetId: string, name: string, targetUserId?: string) => {
    if (!user?.id || !targetUserId) return;
    sendInterest(
      {
        senderId: user.id,
        receiverId: targetUserId,
        targetType: activeTab === 'rooms' ? 'room' : 'seeker',
        targetId,
      },
      name
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Explore All Listings</span>
            <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded-full">
              {totalItems} Available
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Browse verified listings, rooms, and compatible roommates tailored to your lifestyle.
          </p>
        </div>

        {/* Tab Switcher: Rooms vs Seekers */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange('rooms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rooms'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Rooms ({rooms.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('seekers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'seekers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Seekers ({seekers.length})</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & Sort Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                activeTab === 'rooms'
                  ? 'Search rooms by location, host name, amenities, description...'
                  : 'Search seekers by location, name, occupation, bio...'
              }
              className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters & Sort */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Filter Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                activeFilterCount > 0 || isFilterDrawerOpen
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 h-4 w-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'match' | 'priceAsc' | 'priceDesc' | 'newest');
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="match">Sort: Highest Match %</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="newest">Sort: Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {isFilterDrawerOpen && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
            {/* 1. Room Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Space Type
              </label>
              <select
                value={selectedRoomType}
                onChange={(e) => {
                  setSelectedRoomType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden"
              >
                <option value="all">All Types</option>
                <option value="single_room">Single Room</option>
                <option value="shared_room">Shared Room</option>
                <option value="entire_flat">Entire Flat</option>
              </select>
            </div>

            {/* 2. Location Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden"
              >
                <option value="all">All Locations</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Budget / Rent Preset */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {activeTab === 'rooms' ? 'Monthly Rent' : 'Max Budget'}
              </label>
              <select
                value={pricePreset}
                onChange={(e) => {
                  setPricePreset(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden"
              >
                <option value="all">Any Price</option>
                <option value="under15k">Under ₹15,000</option>
                <option value="15k-30k">₹15,000 - ₹30,000</option>
                <option value="30k-50k">₹30,000 - ₹50,000</option>
                <option value="above50k">Above ₹50,000</option>
              </select>
            </div>

            {/* 4. Verified Only & Reset */}
            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 py-1">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => {
                    setVerifiedOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Profiles Only
                </span>
              </label>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline pt-0.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Active Filters:
            </span>
            {selectedRoomType !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                Type: {selectedRoomType.replace('_', ' ')}
                <button type="button" onClick={() => setSelectedRoomType('all')}>
                  <X className="h-3 w-3 hover:text-slate-900" />
                </button>
              </span>
            )}
            {selectedLocation !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                Location: {selectedLocation}
                <button type="button" onClick={() => setSelectedLocation('all')}>
                  <X className="h-3 w-3 hover:text-slate-900" />
                </button>
              </span>
            )}
            {pricePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                Price: {pricePreset}
                <button type="button" onClick={() => setPricePreset('all')}>
                  <X className="h-3 w-3 hover:text-slate-900" />
                </button>
              </span>
            )}
            {verifiedOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium">
                Verified Only
                <button type="button" onClick={() => setVerifiedOnly(false)}>
                  <X className="h-3 w-3 hover:text-emerald-950" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Listings Grid (Paginated 12 per page) */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading listings...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3 max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No matching results found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            We couldn&apos;t find any {activeTab === 'rooms' ? 'rooms' : 'seekers'} matching your
            current search criteria or filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {activeTab === 'rooms'
              ? (paginatedItems as RoomEntity[]).map((room) => {
                  const hostUserId = room.hostId || room.host?.id || '';
                  const interestStatus = getInterestStatus(room.id, hostUserId);
                  const hostName = room.host
                    ? `${room.host.firstName} ${room.host.lastName || ''}`.trim()
                    : 'Property Host';

                  return (
                    <PotentialMatchCard
                      key={room.id}
                      id={room.id}
                      name={room.title || room.roomType.replace('_', ' ')}
                      location={room.location}
                      priceOrBudget={`₹${room.monthlyRent}`}
                      priceLabel="/month"
                      badgeTag={room.roomType.replace('_', ' ')}
                      occupationOrType={`Host: ${hostName}`}
                      imageUrl={room.images?.[0] || room.host?.selfieUrl}
                      matchScore={room.matchPercentage ?? 85}
                      isVerified={Boolean(room.host?.identityVerified)}
                      status={interestStatus}
                      isProcessing={processingId === room.id}
                      onDetails={() => navigate(ROUTES.ROOM_DETAILS.replace(':roomId', room.id))}
                      onAction={() => handleSendInterest(room.id, hostName, hostUserId)}
                    />
                  );
                })
              : (paginatedItems as SeekerPreferenceEntity[]).map((seeker) => {
                  const seekerUserId = seeker.userId || seeker.seeker?.id;
                  const interestStatus = getInterestStatus(seeker.id, seekerUserId);
                  const seekerName = seeker.seeker
                    ? `${seeker.seeker.firstName} ${seeker.seeker.lastName || ''}`.trim()
                    : 'Room Seeker';

                  return (
                    <PotentialMatchCard
                      key={seeker.id}
                      id={seeker.id}
                      name={seekerName}
                      location={seeker.preferredLocation}
                      priceOrBudget={`₹${seeker.maxBudget}`}
                      priceLabel="max budget"
                      badgeTag={seeker.roomTypePreference.replace('_', ' ')}
                      occupationOrType={seeker.seeker?.occupation?.replace('_', ' ')}
                      imageUrl={seeker.seeker?.selfieUrl}
                      matchScore={seeker.matchPercentage ?? 85}
                      isVerified={Boolean(seeker.seeker?.identityVerified)}
                      status={interestStatus}
                      isProcessing={processingId === seeker.id}
                      onDetails={() => {
                        if (seekerUserId) {
                          navigate(ROUTES.USER_PROFILE.replace(':userId', seekerUserId));
                        }
                      }}
                      onAction={() => handleSendInterest(seeker.id, seekerName, seekerUserId)}
                    />
                  );
                })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
              <span className="text-xs text-slate-500 font-medium">
                Showing{' '}
                <strong className="text-slate-900">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900">
                  {Math.min(currentPage * PAGE_SIZE, totalItems)}
                </strong>{' '}
                of <strong className="text-slate-900">{totalItems}</strong> listings
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
