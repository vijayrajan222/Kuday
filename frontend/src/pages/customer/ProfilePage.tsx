import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { onboardingService } from '@/services/onboardingService';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorHandler';
import {
  Wifi,
  Snowflake,
  Utensils,
  WashingMachine,
  Car,
  Laptop,
  Dumbbell,
  PawPrint,
  Plus,
  Minus,
  ChevronDown,
  Trash2,
  Camera,
  Check,
  CheckCircle2,
  X,
  Lock,
  ShieldAlert,
  Clock,
  Cigarette,
  Wine,
  Home,
  User,
  UserCheck,
  Loader2,
} from 'lucide-react';
import type { RoomEntity } from '@/types/onboarding.types';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PasswordStrength } from '@/components/common/PasswordStrength';
import { MAX_DOB, MIN_DOB, validateDob } from '../onboarding/OnboardingProfilePage';

// Amenities Configuration
interface AmenityConfig {
  id: string;
  label: string;
  icon: typeof Wifi;
}

const AMENITY_CONFIG: AmenityConfig[] = [
  { id: 'wifi', label: 'High-speed Wifi', icon: Wifi },
  { id: 'ac', label: 'Air Conditioning', icon: Snowflake },
  { id: 'kitchen', label: 'Modern Kitchen', icon: Utensils },
  { id: 'laundry', label: 'Laundry Access', icon: WashingMachine },
  { id: 'parking', label: 'Vehicle Parking', icon: Car },
  { id: 'workspace', label: 'Dedicated Workspace', icon: Laptop },
  { id: 'gym', label: 'Gym Facility', icon: Dumbbell },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: PawPrint },
];

function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProfileData = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // --- Profile Identity State ---
  const [fullName, setFullName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
  const [bio, setBio] = useState(user?.bio || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [gender, setGender] = useState(user?.gender || 'male');
  const [dob, setDob] = useState(user?.dob || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selfieUrl, setSelfieUrl] = useState(user?.selfieUrl || '');
  const [identityVerified, setIdentityVerified] = useState(Boolean(user?.identityVerified));
  const [role, setRole] = useState<'host' | 'seeker'>(user?.role === 'host' ? 'host' : 'seeker');

  // --- Lifestyle Preferences State ---
  const [smoking, setSmoking] = useState<'never' | 'social' | 'regular'>('never');
  const [drinking, setDrinking] = useState<'never' | 'social' | 'regular'>('never');
  const [pets, setPets] = useState<'no_pets' | 'pet_friendly' | 'has_pets'>('pet_friendly');
  const [sleepSchedule, setSleepSchedule] = useState<'early_bird' | 'night_owl' | 'flexible'>('flexible');
  const [cleanliness, setCleanliness] = useState<'very_clean' | 'moderate' | 'relaxed'>('very_clean');
  const [diet, setDiet] = useState<'veg' | 'non_veg' | 'vegan' | 'anything'>('anything');
  const [visitorPolicy, setVisitorPolicy] = useState<'never' | 'occasional' | 'frequent' | 'flexible'>('flexible');
  const [roommateGenderPref, setRoommateGenderPref] = useState<'any' | 'male' | 'female'>('any');

  // --- Host Room Listing State ---
  const [room, setRoom] = useState<RoomEntity | null>(null);
  const [roomImages, setRoomImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [capacity, setCapacity] = useState<number>(2);
  const [vacancyStatus, setVacancyStatus] = useState<string>('Immediate Vacancy');
  const [availabilityNotes, setAvailabilityNotes] = useState<string>('');
  const [monthlyRent, setMonthlyRent] = useState<string>('45000');
  const [roomLocation, setRoomLocation] = useState<string>('Indiranagar, Bangalore');
  const [roomType, setRoomType] = useState<string>('private_bedroom');
  const [roomDescription, setRoomDescription] = useState<string>('');

  // --- Seeker Search Preferences State ---
  const [preferredLocation, setPreferredLocation] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [roomTypePreference, setRoomTypePreference] = useState<string>('any');
  const [requiredAmenities, setRequiredAmenities] = useState<string[]>([]);

  // --- Modals State ---
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isRoleSwitchModalOpen, setIsRoleSwitchModalOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Change Password Form State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load all user profile, lifestyle, and room/seeker data
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        const profileData = await onboardingService.getUserProfile(userId);
        if (!active) return;

        if (profileData) {
          const first = profileData.firstName || user?.firstName || '';
          const last = profileData.lastName || user?.lastName || '';
          setFullName(`${first} ${last}`.trim());
          setBio(profileData.bio || '');
          setOccupation(profileData.occupation ? profileData.occupation.replace('_', ' ') : '');
          setGender(profileData.gender || 'male');
          setDob(profileData.dob || '');
          setEmail(profileData.email || user?.email || '');
          setSelfieUrl(profileData.selfieUrl || user?.selfieUrl || '');
          setIdentityVerified(Boolean(profileData.identityVerified));
          setRole(profileData.role === 'host' ? 'host' : 'seeker');
        }

        // Load Lifestyle
        try {
          const ls = await onboardingService.getLifestyle(userId);
          if (active && ls) {
            setSmoking((ls.smoking as 'never' | 'social' | 'regular') || 'never');
            setDrinking((ls.drinking as 'never' | 'social' | 'regular') || 'never');
            setSleepSchedule((ls.sleepSchedule as 'early_bird' | 'night_owl' | 'flexible') || 'flexible');
            setCleanliness((ls.cleanliness as 'very_clean' | 'moderate' | 'relaxed') || 'very_clean');
            setDiet((ls.diet as 'veg' | 'non_veg' | 'vegan' | 'anything') || 'anything');
            setVisitorPolicy((ls.visitorPolicy as 'never' | 'occasional' | 'frequent' | 'flexible') || 'flexible');
            setRoommateGenderPref((ls.roommateGenderPref as 'any' | 'male' | 'female') || 'any');

            if (ls.visitorPolicy === 'flexible') setPets('pet_friendly');
            else if (ls.visitorPolicy === 'never') setPets('no_pets');
            else setPets('has_pets');
          }
        } catch {
          // No lifestyle found yet
        }

        // Load Room (if Host) or Seeker Preference (if Seeker)
        const currentRole = profileData?.role || user?.role;
        if (currentRole === 'host') {
          const roomsList = await onboardingService.getRooms(userId);
          if (active && roomsList && roomsList.length > 0) {
            const currentRoom = roomsList[0];
            setRoom(currentRoom);
            setRoomImages(currentRoom.images || []);
            setAmenities(currentRoom.amenities || []);
            setCapacity(currentRoom.capacity || 2);
            setAvailabilityNotes(currentRoom.availabilityNotes || '');
            setMonthlyRent(String(currentRoom.monthlyRent || '45000'));
            setRoomLocation(currentRoom.location || '');
            setRoomType(currentRoom.roomType || 'private_bedroom');
            setRoomDescription(currentRoom.description || '');
          }
        } else if (currentRole === 'seeker') {
          const seekerData = await onboardingService.getSeekerPreferences(userId);
          if (active && seekerData) {
            const singlePref = Array.isArray(seekerData)
              ? seekerData.length > 0 ? seekerData[0] : null
              : seekerData;
            if (singlePref) {
              setPreferredLocation(singlePref.preferredLocation || '');
              setMaxBudget(String(singlePref.maxBudget || ''));
              setRoomTypePreference(singlePref.roomTypePreference || 'any');
              setRequiredAmenities(singlePref.requiredAmenities || []);
            }
          }
        }
      } catch (err) {
        if (active) toast.error(`Failed to load profile data: ${getErrorMessage(err)}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user?.id, refreshKey]);

  // Handle direct upload of profile photo / avatar
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      toast.info('Uploading profile photo...');
      const compressed = await compressImage(file, 800, 800, 0.8);
      await onboardingService.updateProfile(user.id, { selfieBase64: compressed });
      toast.success('Profile photo updated successfully!');
      fetchProfileData();
    } catch (err) {
      toast.error(`Failed to update profile photo: ${getErrorMessage(err)}`);
    }
  };

  // Handle adding room photos
  const handleAddRoomPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user?.id) return;
    try {
      toast.info('Uploading room photo(s)...');
      const newBase64List: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          const compressed = await compressImage(file);
          newBase64List.push(compressed);
        }
      }
      const updated = await onboardingService.createRoom({
        hostId: user.id,
        roomType,
        monthlyRent: Number(monthlyRent) || 20000,
        location: roomLocation.trim() || 'Bangalore',
        capacity,
        availabilityNotes,
        amenities,
        description: roomDescription,
        images: roomImages,
        imagesBase64: newBase64List,
      });

      toast.success('Room photos uploaded successfully!');
      if (updated?.data?.images) {
        setRoomImages(updated.data.images);
      }
      fetchProfileData();
    } catch (err) {
      toast.error(`Failed to upload photo(s): ${getErrorMessage(err)}`);
    }
  };

  // Handle removing a room photo
  const handleRemoveRoomImage = async (imgUrl: string) => {
    if (!user?.id) return;
    const filtered = roomImages.filter((img) => img !== imgUrl);
    setRoomImages(filtered);
    try {
      await onboardingService.createRoom({
        hostId: user.id,
        roomType,
        monthlyRent: Number(monthlyRent) || 20000,
        location: roomLocation.trim() || 'Bangalore',
        capacity,
        availabilityNotes,
        amenities,
        description: roomDescription,
        images: filtered,
      });
      toast.success('Photo removed.');
    } catch {
      toast.error('Failed to update room photos.');
    }
  };

  // Toggle Amenities
  const toggleAmenity = (amenityId: string) => {
    setAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId]
    );
  };

  const toggleRequiredAmenity = (amenityId: string) => {
    setRequiredAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId]
    );
  };

  // Switch Role
  const executeRoleSwitch = async () => {
    if (!user?.id) return;
    const targetRole = role === 'host' ? 'seeker' : 'host';
    try {
      setSwitchingRole(true);
      setIsRoleSwitchModalOpen(false);
      toast.info(`Switching active role to ${targetRole === 'host' ? 'Room Host' : 'Room Seeker'}...`);
      await onboardingService.updateRole(user.id, targetRole);
      updateUser({ role: targetRole });
      setRole(targetRole);
      toast.success(
        `Role switched to ${targetRole === 'host' ? 'Room Host' : 'Room Seeker'}! Your previous post has been hidden.`
      );
      fetchProfileData();
    } catch (err) {
      toast.error(`Failed to switch role: ${getErrorMessage(err)}`);
    } finally {
      setSwitchingRole(false);
    }
  };

  // Save All Profile & Account Changes
  const handleSaveProfileChanges = async () => {
    if (!user?.id) return;

    if (dob) {
      const dobErr = validateDob(dob);
      if (dobErr) {
        toast.error(dobErr);
        return;
      }
    }

    // Split name into first and last name
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ');

    try {
      setSavingAll(true);

      // 1. Save User Profile
      await onboardingService.updateProfile(user.id, {
        firstName,
        lastName,
        dob,
        gender,
        occupation: occupation.replace(/\s+/g, '_').toLowerCase(),
        bio,
      });

      // 2. Save Lifestyle Preferences
      await onboardingService.saveLifestyle({
        userId: user.id,
        smoking,
        drinking,
        sleepSchedule,
        diet,
        cleanliness,
        visitorPolicy,
        roommateGenderPref,
      });

      // 3. Save Room (if Host)
      if (role === 'host') {
        const rent = Number(monthlyRent) || 20000;
        await onboardingService.createRoom({
          hostId: user.id,
          roomType,
          monthlyRent: rent,
          location: roomLocation.trim() || 'Indiranagar, Bangalore',
          capacity,
          availabilityNotes: availabilityNotes.trim(),
          amenities,
          images: roomImages,
          description: roomDescription.trim(),
        });
      }

      // 4. Save Seeker Preferences (if Seeker)
      if (role === 'seeker') {
        const budget = Number(maxBudget) || 20000;
        await onboardingService.saveSeekerPreferences({
          userId: user.id,
          preferredLocation: preferredLocation.trim() || 'Anywhere',
          maxBudget: budget,
          roomTypePreference,
          requiredAmenities,
        });
      }

      updateUser({
        firstName,
        lastName,
        bio,
        gender,
        dob,
      });

      toast.success('Profile and preferences saved successfully! 🎉');
      fetchProfileData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingAll(false);
    }
  };

  // Change Password Submission
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setChangePasswordError(null);

    const { currentPassword, newPassword, confirmPassword } = changePasswordForm;

    if (!newPassword || newPassword.length < 8) {
      setChangePasswordError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('Passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await onboardingService.changePassword(user.id, {
        currentPassword: currentPassword.trim() || undefined,
        newPassword,
        confirmPassword,
      });

      toast.success('Password changed successfully!');
      setIsChangePasswordOpen(false);
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = getErrorMessage(err);
      setChangePasswordError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Listing ID Display
  const listingId = useMemo(() => {
    if (room?.id) {
      return `KD-${room.id.slice(-6).toUpperCase()}`;
    }
    return 'KD-9283-X';
  }, [room?.id]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User Profile &amp; Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal profile, lifestyle preferences, identity verification, and role settings.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRoleSwitchModalOpen(true)}
            disabled={switchingRole}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            {role === 'host' ? (
              <>
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>Switch to Room Seeker</span>
              </>
            ) : (
              <>
                <Home className="h-4 w-4 text-teal-600" />
                <span>Switch to Room Host</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsChangePasswordOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Account Security"
          >
            <Lock className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Change Password</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-4 bg-slate-50 text-slate-500 text-xs rounded-2xl border border-slate-200">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-slate-700" />
          Loading your profile &amp; preferences...
        </div>
      )}

      {/* Main Grid: Responsive Dual-Column Layout */}
      <div
        className={
          role === 'host'
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'
            : 'max-w-3xl mx-auto space-y-8'
        }
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Manage Listing (Rendered ONLY when user is Host)            */}
        {/* ========================================================================= */}
        {role === 'host' && (
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-7">
              {/* Manage Listing Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Manage Listing
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Listing ID: {listingId}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditRoomOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Edit Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this listing?')) {
                        setRoom(null);
                        setRoomImages([]);
                        toast.info('Listing removed.');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* ROOM IMAGES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ROOM IMAGES
                  </label>
                  <label
                    htmlFor="upload-room-images-top"
                    className="text-xs font-bold text-slate-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    + Upload New
                    <input
                      id="upload-room-images-top"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddRoomPhotos}
                    />
                  </label>
                </div>

                {/* Images Gallery */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {roomImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 border border-slate-200"
                    >
                      <img
                        src={imgUrl}
                        alt={`Room view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRoomImage(imgUrl)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Tile */}
                  <label
                    htmlFor="add-room-image-tile"
                    className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 aspect-4/3 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-slate-50/50"
                  >
                    <Camera className="h-6 w-6 stroke-1" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">ADD</span>
                    <input
                      id="add-room-image-tile"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddRoomPhotos}
                    />
                  </label>
                </div>
              </div>

              {/* AMENITIES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    AMENITIES
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEditRoomOpen(true)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {AMENITY_CONFIG.map((item) => {
                    const Icon = item.icon;
                    const isSelected = amenities.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAmenity(item.id)}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-slate-100/90 text-slate-900 border-slate-200 shadow-2xs'
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isSelected ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AVAILABILITY & VACANCY */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  AVAILABILITY &amp; VACANCY
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Slots Stepper */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      TOTAL SLOTS
                    </span>
                    <div className="flex items-center border border-slate-200 rounded-2xl bg-white overflow-hidden w-36 h-11">
                      <button
                        type="button"
                        onClick={() => setCapacity((c) => Math.max(1, c - 1))}
                        className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 text-base font-bold transition-colors cursor-pointer select-none"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex-1 text-center font-bold text-slate-900 text-sm select-none">
                        {String(capacity).padStart(2, '0')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCapacity((c) => Math.min(20, c + 1))}
                        className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 text-base font-bold transition-colors cursor-pointer select-none"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vacancy Status Select */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      VACANCY STATUS
                    </span>
                    <div className="relative">
                      <select
                        value={vacancyStatus}
                        onChange={(e) => setVacancyStatus(e.target.value)}
                        className="w-full h-11 rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-xs font-semibold text-slate-800 appearance-none focus:outline-hidden focus:border-slate-900 transition-colors cursor-pointer"
                      >
                        <option value="Immediate Vacancy">Immediate Vacancy</option>
                        <option value="Available Next Month">Available Next Month</option>
                        <option value="Available Soon">Available Soon</option>
                        <option value="Occupied / Full">Occupied / Full</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* AVAILABILITY NOTES */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  AVAILABILITY NOTES
                </label>
                <textarea
                  rows={3}
                  value={availabilityNotes}
                  onChange={(e) => setAvailabilityNotes(e.target.value)}
                  placeholder="Add specific details about viewing hours or seasonal availability..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 resize-none transition-colors"
                />
              </div>

              {/* Bottom Feature Card */}
              <div className="rounded-2xl bg-black text-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">👑</span>
                    <h3 className="text-sm font-bold tracking-tight">Verified Host Pro</h3>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-md">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Get 3x more visibility, priority matching, and verified visit coordination with vetted roommates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Profile + Lifestyle + Seeker Prefs + Save Button           */}
        {/* ========================================================================= */}
        <div className={role === 'host' ? 'lg:col-span-5 space-y-6' : 'space-y-6'}>
          {/* Card 1: User Profile Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                {role === 'host' ? 'Host Profile' : 'Seeker Profile'}
              </h2>
              {identityVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Not Verified
                </span>
              )}
            </div>

            {/* Profile Avatar & Change Link */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="relative group">
                {selfieUrl ? (
                  <img
                    src={selfieUrl}
                    alt={fullName}
                    className="h-24 w-24 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-slate-900 text-white font-black text-2xl flex items-center justify-center shadow-xs">
                    {fullName.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              <label
                htmlFor="profile-avatar-upload"
                className="text-xs font-semibold text-slate-900 hover:underline cursor-pointer pt-1"
              >
                Change Avatar
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoUpload}
                />
              </label>
            </div>

            {/* NAME Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                NAME
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alexander Vance"
                className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 transition-colors"
              />
            </div>

            {/* BIO Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                BIO
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Architect based in London. I value quiet evenings, cleanliness, and intellectual discussions..."
                className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 resize-none transition-colors leading-relaxed"
              />
            </div>

            {/* Occupation, Gender & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  OCCUPATION
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Architect"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  DATE OF BIRTH
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={MAX_DOB}
                  min={MIN_DOB}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>

            {/* Gender Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                GENDER
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`py-2 px-3 rounded-xl border text-xs capitalize transition-all cursor-pointer ${
                      gender === g.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Field (Account identifier) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Card 2 (If Seeker): Room & Search Preferences */}
          {role === 'seeker' && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-5">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Room Search Criteria
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    TARGET LOCATION
                  </label>
                  <input
                    type="text"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    placeholder="e.g. Indiranagar, Bangalore"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    MAX MONTHLY BUDGET (₹)
                  </label>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Room Type Preference */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  ROOM TYPE PREFERENCE
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'private_bedroom', label: 'Private Room' },
                    { value: 'shared_room', label: 'Shared Room' },
                    { value: 'any', label: 'Any Type' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setRoomTypePreference(t.value)}
                      className={`py-2 px-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        roomTypePreference === t.value
                          ? 'bg-black text-white font-bold border-black shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required Amenities */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  REQUIRED AMENITIES
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_CONFIG.map((item) => {
                    const isSelected = requiredAmenities.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleRequiredAmenity(item.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-100 text-slate-900 font-bold border-slate-300'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Lifestyle Preferences Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Lifestyle Preferences
            </h2>

            {/* SMOKING */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Cigarette className="h-3.5 w-3.5 text-slate-500" />
                SMOKING
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'never', label: 'Non-smoker' },
                  { value: 'regular', label: 'Smoker' },
                  { value: 'social', label: 'Outside only' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSmoking(opt.value as 'never' | 'social' | 'regular')}
                    className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      smoking === opt.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DRINKING */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Wine className="h-3.5 w-3.5 text-slate-500" />
                DRINKING
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'never', label: 'Non-drinker' },
                  { value: 'social', label: 'Social' },
                  { value: 'regular', label: 'Regular' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDrinking(opt.value as 'never' | 'social' | 'regular')}
                    className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      drinking === opt.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PETS */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <PawPrint className="h-3.5 w-3.5 text-slate-500" />
                PETS
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'no_pets', label: 'No Pets' },
                  { value: 'pet_friendly', label: 'Pet Friendly' },
                  { value: 'has_pets', label: 'Has Pets' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPets(opt.value as 'no_pets' | 'pet_friendly' | 'has_pets')}
                    className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      pets === opt.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SLEEP SCHEDULE */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                SLEEP SCHEDULE
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'early_bird', label: 'Early Bird' },
                  { value: 'night_owl', label: 'Night Owl' },
                  { value: 'flexible', label: 'Flexible' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSleepSchedule(opt.value as 'early_bird' | 'night_owl' | 'flexible')}
                    className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      sleepSchedule === opt.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CLEANLINESS */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                CLEANLINESS
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'very_clean', label: 'Very Clean' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'relaxed', label: 'Relaxed' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCleanliness(opt.value as 'very_clean' | 'moderate' | 'relaxed')}
                    className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      cleanliness === opt.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DIET */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-slate-500" />
                DIET
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'veg', label: 'Vegetarian' },
                  { value: 'non_veg', label: 'Non-Veg' },
                  { value: 'anything', label: 'Flexible' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDiet(opt.value as 'veg' | 'non_veg' | 'vegan' | 'anything')}
                    className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      diet === opt.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VISITOR POLICY */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-slate-500" />
                VISITOR POLICY
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'never', label: 'Quiet / No' },
                  { value: 'occasional', label: 'Occasional' },
                  { value: 'flexible', label: 'Flexible' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisitorPolicy(opt.value as 'never' | 'occasional' | 'frequent' | 'flexible')}
                    className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      visitorPolicy === opt.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ROOMMATE PREFERENCE */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                ROOMMATE GENDER PREFERENCE
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'any', label: 'Any Gender' },
                  { value: 'male', label: 'Male Only' },
                  { value: 'female', label: 'Female Only' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoommateGenderPref(opt.value as 'any' | 'male' | 'female')}
                    className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      roommateGenderPref === opt.value
                        ? 'bg-black text-white font-bold border-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AT LAST: SAVE PROFILE CHANGES BUTTON */}
          <div className="sticky bottom-6 z-20">
            <button
              type="button"
              disabled={savingAll}
              onClick={handleSaveProfileChanges}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-black hover:bg-slate-800 disabled:opacity-50 text-white py-4 px-6 text-sm font-bold shadow-lg transition-all cursor-pointer"
            >
              {savingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Room Listing Modal */}
      {isEditRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsEditRoomOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Home className="h-5 w-5 text-slate-700" /> Edit Listing Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update the core property parameters, location, and monthly rent.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={roomLocation}
                  onChange={(e) => setRoomLocation(e.target.value)}
                  placeholder="e.g. Indiranagar, Bangalore"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                >
                  <option value="private_bedroom">Private Bedroom</option>
                  <option value="shared_room">Shared Room</option>
                  <option value="entire_apartment">Entire Apartment</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Room Description
                </label>
                <textarea
                  rows={3}
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="Describe the room, house rules, and nearby amenities..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditRoomOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditRoomOpen(false);
                    handleSaveProfileChanges();
                  }}
                  className="flex-1 rounded-xl bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors"
                >
                  Apply &amp; Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Switch Confirmation Modal */}
      {isRoleSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                {role === 'host' ? <UserCheck className="h-5 w-5" /> : <Home className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Switch to {role === 'host' ? 'Room Seeker' : 'Room Host'}?
                </h3>
                <p className="text-xs text-slate-400">Toggle your account active mode.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              When you switch roles, your listing in the other mode will be hidden from public search to keep the marketplace accurate.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRoleSwitchModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={switchingRole}
                onClick={executeRoleSwitch}
                className="flex-1 rounded-xl bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {switchingRole ? 'Switching...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-slate-800" /> Change Password
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your current password and a new secure password.
              </p>
            </div>

            {changePasswordError && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                {changePasswordError}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Current Password
                </label>
                <PasswordInput
                  value={changePasswordForm.currentPassword}
                  onChange={(e) =>
                    setChangePasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  New Password
                </label>
                <PasswordInput
                  value={changePasswordForm.newPassword}
                  onChange={(e) =>
                    setChangePasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter new secure password"
                />
                <PasswordStrength password={changePasswordForm.newPassword} />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Confirm New Password
                </label>
                <PasswordInput
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) =>
                    setChangePasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 rounded-xl bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
