import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { onboardingService } from '@/services/onboardingService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorHandler';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Home,
  UserCheck,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Briefcase,
  User,
  X,
  Upload,
  Camera,
  Plus,
  Trash2,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import type { RoomEntity, SeekerPreferenceEntity } from '@/types/onboarding.types';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PasswordStrength } from '@/components/common/PasswordStrength';
import { MAX_DOB, MIN_DOB, validateDob } from '../onboarding/OnboardingProfilePage';

// Available Amenities for Host/Seeker checklists
const AMENITY_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'laundry', label: 'Laundry / Washing Machine' },
  { id: 'ac', label: 'Air Conditioner (AC)' },
  { id: 'pet_friendly', label: 'Pet Friendly' },
  { id: 'kitchen', label: 'Equipped Kitchen' },
  { id: 'workspace', label: 'Dedicated Workspace' },
  { id: 'gym', label: 'Gym Facility' },
  { id: 'parking', label: 'Vehicle Parking' },
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
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProfileData = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    occupation: user?.occupation || '',
    bio: user?.bio || '',
    role: user?.role || 'seeker',
    identityVerified: Boolean(user?.identityVerified),
    selfieUrl: user?.selfieUrl || '',
    idCardUrl: user?.idCardUrl || '',
  });

  const [lifestyle, setLifestyle] = useState({
    smoking: 'never',
    drinking: 'never',
    sleepSchedule: 'flexible',
    diet: 'anything',
    cleanliness: 'very_clean',
    visitorPolicy: 'flexible',
    roommateGenderPref: 'any',
  });

  const [room, setRoom] = useState<RoomEntity | null>(null);
  const [seekerPref, setSeekerPref] = useState<SeekerPreferenceEntity | null>(null);

  // Edit Modals State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isEditSeekerOpen, setIsEditSeekerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileDobError, setProfileDobError] = useState<string | null>(null);

  // Change Password Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Edit Form Inputs
  const [editProfileForm, setEditProfileForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'male',
    occupation: 'student',
    bio: '',
    smoking: 'never',
    drinking: 'never',
    sleepSchedule: 'flexible',
    diet: 'anything',
    cleanliness: 'very_clean',
    visitorPolicy: 'flexible',
    roommateGenderPref: 'any',
  });

  const [editRoomForm, setEditRoomForm] = useState({
    roomType: 'private_bedroom',
    monthlyRent: '',
    location: '',
    capacity: '1',
    availabilityNotes: '',
    description: '',
    amenities: [] as string[],
    imagesBase64: [] as string[],
  });

  const [editSeekerForm, setEditSeekerForm] = useState({
    preferredLocation: '',
    maxBudget: '',
    roomTypePreference: 'any',
    requiredAmenities: [] as string[],
  });

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    let active = true;

    async function loadAllProfileData() {
      try {
        const profileData = await onboardingService.getUserProfile(userId);
        if (!active) return;
        if (profileData) {
          setUserProfile({
            firstName: profileData.firstName || user?.firstName || '',
            lastName: profileData.lastName || user?.lastName || '',
            email: profileData.email || user?.email || '',
            dob: profileData.dob || '',
            gender: profileData.gender || 'male',
            occupation: profileData.occupation || 'student',
            bio: profileData.bio || '',
            role: profileData.role || 'seeker',
            identityVerified: Boolean(profileData.identityVerified),
            selfieUrl: profileData.selfieUrl || '',
            idCardUrl: profileData.idCardUrl || '',
          });
        }

        // Fetch Lifestyle
        try {
          const ls = await onboardingService.getLifestyle(userId);
          if (active && ls) {
            setLifestyle({
              smoking: ls.smoking || 'never',
              drinking: ls.drinking || 'never',
              sleepSchedule: ls.sleepSchedule || 'flexible',
              diet: ls.diet || 'anything',
              cleanliness: ls.cleanliness || 'very_clean',
              visitorPolicy: ls.visitorPolicy || 'flexible',
              roommateGenderPref: ls.roommateGenderPref || 'any',
            });
          }
        } catch {
          // Ignored if not found
        }

        // Fetch Room if Host, or Seeker Preference if Seeker
        const currentRole = profileData?.role || user?.role;
        if (currentRole === 'host') {
          const roomsList = await onboardingService.getRooms(userId);
          if (active && roomsList && roomsList.length > 0) {
            setRoom(roomsList[0]);
          }
        } else if (currentRole === 'seeker') {
          const seekerData = await onboardingService.getSeekerPreferences(userId);
          if (active && seekerData) {
            const singlePref = Array.isArray(seekerData)
              ? (seekerData.length > 0 ? seekerData[0] : null)
              : seekerData;
            setSeekerPref(singlePref);
          }
        }
      } catch (err) {
        if (active) toast.error(`Failed to load profile data: ${getErrorMessage(err)}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAllProfileData();

    return () => {
      active = false;
    };
  }, [user?.id, refreshKey]);

  // Open Profile Edit Modal
  const openEditProfile = () => {
    setProfileDobError(null);
    setEditProfileForm({
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      dob: userProfile.dob,
      gender: userProfile.gender || 'male',
      occupation: userProfile.occupation || 'student',
      bio: userProfile.bio,
      smoking: lifestyle.smoking,
      drinking: lifestyle.drinking,
      sleepSchedule: lifestyle.sleepSchedule,
      diet: lifestyle.diet,
      cleanliness: lifestyle.cleanliness,
      visitorPolicy: lifestyle.visitorPolicy,
      roommateGenderPref: lifestyle.roommateGenderPref,
    });
    setIsEditProfileOpen(true);
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (editProfileForm.dob) {
      const dobErr = validateDob(editProfileForm.dob);
      if (dobErr) {
        setProfileDobError(dobErr);
        toast.error(dobErr);
        return;
      }
    }
    try {
      setSubmitting(true);
      // Update User Profile fields
      await onboardingService.updateProfile(user.id, {
        dob: editProfileForm.dob,
        gender: editProfileForm.gender,
        occupation: editProfileForm.occupation,
        bio: editProfileForm.bio,
      });

      // Update Lifestyle
      await onboardingService.saveLifestyle({
        userId: user.id,
        smoking: editProfileForm.smoking,
        drinking: editProfileForm.drinking,
        sleepSchedule: editProfileForm.sleepSchedule,
        diet: editProfileForm.diet,
        cleanliness: editProfileForm.cleanliness,
        visitorPolicy: editProfileForm.visitorPolicy,
        roommateGenderPref: editProfileForm.roommateGenderPref,
      });

      toast.success("Profile updated successfully!");
      setIsEditProfileOpen(false);
      fetchProfileData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Open Room Edit Modal
  const openEditRoom = () => {
    if (room) {
      setEditRoomForm({
        roomType: room.roomType || 'private_bedroom',
        monthlyRent: String(room.monthlyRent || ''),
        location: room.location || '',
        capacity: String(room.capacity || '1'),
        availabilityNotes: room.availabilityNotes || '',
        description: room.description || '',
        amenities: room.amenities || [],
        imagesBase64: [],
      });
    }
    setIsEditRoomOpen(true);
  };

  const handleRoomUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!editRoomForm.location.trim() || editRoomForm.location.trim().length < 2) {
      toast.error("City / Location must be at least 2 characters.");
      return;
    }
    const rent = Number(editRoomForm.monthlyRent);
    if (isNaN(rent) || rent < 500) {
      toast.error("Monthly rent must be at least ₹500.");
      return;
    }
    const capacity = Number(editRoomForm.capacity) || 1;
    if (capacity < 1 || capacity > 50) {
      toast.error("Capacity must be between 1 and 50.");
      return;
    }
    try {
      setSubmitting(true);
      await onboardingService.createRoom({
        hostId: user.id,
        roomType: editRoomForm.roomType,
        monthlyRent: rent,
        location: editRoomForm.location.trim(),
        capacity: capacity,
        availabilityNotes: editRoomForm.availabilityNotes,
        amenities: editRoomForm.amenities,
        images: room?.images || [],
        imagesBase64: editRoomForm.imagesBase64,
        description: editRoomForm.description,
      });

      toast.success("Room listing updated successfully!");
      setIsEditRoomOpen(false);
      fetchProfileData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Replace Profile Picture Handler
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      toast.info("Uploading profile photo...");
      const compressed = await compressImage(file, 800, 800, 0.8);
      await onboardingService.updateProfile(user.id, { selfieBase64: compressed });
      toast.success("Profile photo updated successfully!");
      fetchProfileData();
    } catch (err) {
      toast.error(`Failed to update profile photo: ${getErrorMessage(err)}`);
    }
  };

  // Room Gallery Photo Direct Handlers
  const handleRemoveRoomPhoto = async (photoUrlToRemove: string) => {
    if (!user?.id || !room) return;
    try {
      const updatedImages = (room.images || []).filter((img) => img !== photoUrlToRemove);
      toast.info("Removing photo...");
      await onboardingService.createRoom({
        hostId: user.id,
        roomType: room.roomType,
        monthlyRent: room.monthlyRent,
        location: room.location,
        capacity: room.capacity,
        availabilityNotes: room.availabilityNotes,
        amenities: room.amenities,
        description: room.description,
        images: updatedImages,
      });
      toast.success("Photo removed successfully!");
      fetchProfileData();
    } catch (err) {
      toast.error(`Failed to remove photo: ${getErrorMessage(err)}`);
    }
  };

  const handleAddRoomPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user?.id || !room) return;
    try {
      toast.info("Uploading room photo(s)...");
      const newBase64List: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          const compressed = await compressImage(file);
          newBase64List.push(compressed);
        }
      }
      await onboardingService.createRoom({
        hostId: user.id,
        roomType: room.roomType,
        monthlyRent: room.monthlyRent,
        location: room.location,
        capacity: room.capacity,
        availabilityNotes: room.availabilityNotes,
        amenities: room.amenities,
        description: room.description,
        images: room.images || [],
        imagesBase64: newBase64List,
      });
      toast.success("Room photo(s) added successfully!");
      fetchProfileData();
    } catch (err) {
      toast.error(`Failed to upload photo(s): ${getErrorMessage(err)}`);
    }
  };

  // Switch Role Confirmation Modal Handler
  const [switchingRole, setSwitchingRole] = useState(false);
  const [isRoleSwitchModalOpen, setIsRoleSwitchModalOpen] = useState(false);

  const handleOpenRoleSwitchModal = () => {
    setIsRoleSwitchModalOpen(true);
  };

  const executeRoleSwitch = async () => {
    if (!user?.id) return;
    const targetRole = userProfile.role === 'host' ? 'seeker' : 'host';
    try {
      setSwitchingRole(true);
      setIsRoleSwitchModalOpen(false);
      toast.info(`Switching active role to ${targetRole === 'host' ? 'Room Host' : 'Room Seeker'}...`);
      await onboardingService.updateRole(user.id, targetRole);
      updateUser({ role: targetRole });

      setUserProfile((prev) => ({ ...prev, role: targetRole }));
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

  // Open Seeker Edit Modal
  const openEditSeeker = () => {
    if (seekerPref) {
      setEditSeekerForm({
        preferredLocation: seekerPref.preferredLocation || '',
        maxBudget: String(seekerPref.maxBudget || ''),
        roomTypePreference: seekerPref.roomTypePreference || 'any',
        requiredAmenities: seekerPref.requiredAmenities || [],
      });
    }
    setIsEditSeekerOpen(true);
  };

  const handleSeekerUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!editSeekerForm.preferredLocation.trim() || editSeekerForm.preferredLocation.trim().length < 2) {
      toast.error("Preferred location must be at least 2 characters.");
      return;
    }
    const budget = Number(editSeekerForm.maxBudget);
    if (isNaN(budget) || budget < 500) {
      toast.error("Maximum budget must be at least ₹500.");
      return;
    }
    try {
      setSubmitting(true);
      await onboardingService.saveSeekerPreferences({
        userId: user.id,
        preferredLocation: editSeekerForm.preferredLocation.trim(),
        maxBudget: budget,
        roomTypePreference: editSeekerForm.roomTypePreference,
        requiredAmenities: editSeekerForm.requiredAmenities,
      });

      toast.success("Seeker search preferences updated successfully!");
      setIsEditSeekerOpen(false);
      fetchProfileData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxFiles = Math.min(files.length, 5 - editRoomForm.imagesBase64.length);
    const newImages: string[] = [];

    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      if (file) {
        try {
          const compressed = await compressImage(file);
          newImages.push(compressed);
        } catch {
          // Fallback
        }
      }
    }
    setEditRoomForm((prev) => ({
      ...prev,
      imagesBase64: [...prev.imagesBase64, ...newImages],
    }));
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setChangePasswordError(null);

    const { currentPassword, newPassword, confirmPassword } = changePasswordForm;

    if (!newPassword) {
      setChangePasswordError('New password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setChangePasswordError('Password must be at least 8 characters long.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setChangePasswordError(
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('New password and confirm password do not match.');
      return;
    }

    if (currentPassword && currentPassword === newPassword) {
      setChangePasswordError('New password cannot be the same as your current password.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await onboardingService.changePassword(user.id, {
        currentPassword: currentPassword.trim() ? currentPassword : undefined,
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Profile & Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal profile, lifestyle preferences, identity verification, and role settings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenRoleSwitchModal}
            disabled={switchingRole}
            leftIcon={
              userProfile.role === 'host' ? (
                <UserCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <Home className="h-4 w-4 text-teal-600" />
              )
            }
          >
            {userProfile.role === 'host' ? 'Switch to Room Seeker' : 'Switch to Room Host'}
          </Button>

          <Button variant="outline" size="sm" leftIcon={<Edit3 className="h-4 w-4" />} onClick={openEditProfile}>
            Edit Profile
          </Button>
        </div>
      </div>

      {loading && (
        <div className="p-3 text-center bg-emerald-50 text-emerald-800 text-xs rounded-xl">
          Updating latest profile details...
        </div>
      )}

      {/* Main Profile Layout */}
      {userProfile.role === 'host' ? (
        /* HOST LAYOUT: Left side Personal Details, Right side Room Details */
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Personal Profile & Verification */}
          <div className="space-y-6 lg:col-span-1">
            {/* Identity Card */}
            <Card className="p-6 text-center space-y-4 border border-slate-200 shadow-sm">
              <div className="relative inline-block mx-auto group">
                {userProfile.selfieUrl ? (
                  <img
                    src={userProfile.selfieUrl}
                    alt={userProfile.firstName}
                    className="h-28 w-28 rounded-full object-cover border-4 border-emerald-500 shadow"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-3xl flex items-center justify-center border-4 border-emerald-500 shadow">
                    {userProfile.firstName ? userProfile.firstName[0].toUpperCase() : 'U'}
                  </div>
                )}

                <label
                  htmlFor="host-profile-image-upload"
                  className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                  title="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="host-profile-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePhotoUpload}
                  />
                </label>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {userProfile.firstName} {userProfile.lastName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{userProfile.email}</p>
              </div>

              {/* Verification & Role Badges */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {/* STRICT VERIFICATION STATUS BADGE */}
                {userProfile.identityVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ✓ Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    <XCircle className="h-3.5 w-3.5 text-amber-600" />
                    Not Verified
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleOpenRoleSwitchModal}
                  disabled={switchingRole}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 hover:bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200 capitalize transition cursor-pointer"
                  title="Click to switch role to Seeker"
                >
                  <Home className="h-3.5 w-3.5 text-teal-600" />
                  <span>Role: Host (Click to Switch)</span>
                </button>
              </div>
            </Card>

            {/* Personal Profile Details Card */}
            <Card className="p-5 space-y-4 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Personal Information
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date of Birth
                  </span>
                  <span className="font-semibold text-slate-800">{userProfile.dob || 'Not specified'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" /> Gender
                  </span>
                  <span className="font-semibold text-slate-800 capitalize">{userProfile.gender || 'Not specified'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Occupation
                  </span>
                  <span className="font-semibold text-slate-800 capitalize">{(userProfile.occupation || '').replace('_', ' ') || 'Not specified'}</span>
                </div>

                {userProfile.bio && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block mb-1 font-medium">Bio</span>
                    <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{userProfile.bio}"
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Lifestyle & Living Habits */}
            <Card className="p-5 space-y-3 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Lifestyle & Living Habits
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Smoking</span>
                  <span className="font-semibold text-slate-800 capitalize">{lifestyle.smoking || 'never'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Drinking</span>
                  <span className="font-semibold text-slate-800 capitalize">{lifestyle.drinking || 'never'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Sleep Schedule</span>
                  <span className="font-semibold text-slate-800 capitalize">{(lifestyle.sleepSchedule || '').replace('_', ' ') || 'flexible'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Diet</span>
                  <span className="font-semibold text-slate-800 capitalize">{(lifestyle.diet || '').replace('_', ' ') || 'anything'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Cleanliness</span>
                  <span className="font-semibold text-slate-800 capitalize">{(lifestyle.cleanliness || '').replace('_', ' ') || 'very clean'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Visitor Policy</span>
                  <span className="font-semibold text-slate-800 capitalize">{(lifestyle.visitorPolicy || '').replace('_', ' ') || 'flexible'}</span>
                </div>
              </div>
            </Card>
            {/* Account Security Card */}
            <Card className="p-5 space-y-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-600" /> Account Security
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Keep your account secure with a strong and updated password.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold justify-center"
                leftIcon={<Lock className="h-3.5 w-3.5" />}
                onClick={() => {
                  setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setChangePasswordError(null);
                  setIsChangePasswordOpen(true);
                }}
              >
                Change Password
              </Button>
            </Card>
          </div>

          {/* Right Column: Host Room Details */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6 space-y-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <Home className="h-5 w-5 text-emerald-600" />
                      Host Room Listing Details
                    </h2>
                    {userProfile.role === 'host' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        🟢 Active Listing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        🔴 Listing Inactive (Disabled)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Property information visible to potential room seekers</p>
                </div>

                <Button size="sm" variant="outline" leftIcon={<Edit3 className="h-4 w-4" />} onClick={openEditRoom}>
                  Edit Room
                </Button>
              </div>

              {room ? (
                <div className="space-y-6">
                  {/* Room Photos Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-700">Room Gallery Photos</h3>
                      <span className="text-[11px] font-medium text-slate-400">
                        {room.images?.length || 0} photo(s) uploaded
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {/* Existing Room Photos with Remove button overlay */}
                      {room.images && room.images.map((img, i) => (
                        <div
                          key={i}
                          className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900"
                        >
                          <img
                            src={img}
                            alt={`Room photo ${i + 1}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 transition-opacity flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveRoomPhoto(img)}
                              className="inline-flex items-center gap-1 bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md shadow transition-colors"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* '+' Add Photo Tile Button */}
                      <label
                        htmlFor="direct-add-room-photo-input"
                        className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:hover:bg-slate-700/80 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500 group p-2 text-center"
                        title="Add room photo"
                      >
                        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-xs">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">Add Photo</span>
                        <span className="text-[10px] text-slate-400">Click to upload</span>
                        <input
                          id="direct-add-room-photo-input"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleAddRoomPhotos}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Room Key Information */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Home className="h-3.5 w-3.5 text-emerald-600" /> Room Type
                      </span>
                      <p className="font-bold text-slate-900 capitalize text-base">
                        {(room.roomType || '').replace('_', ' ') || 'Private Bedroom'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Monthly Rent
                      </span>
                      <p className="font-bold text-emerald-700 text-base">
                        ₹{room.monthlyRent} <span className="text-xs text-slate-500 font-normal">/month</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Location / City
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {room.location}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-emerald-600" /> Vacant Count / Capacity
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {room.capacity} Person(s)
                      </p>
                    </div>
                  </div>

                  {/* Availability Notes */}
                  {room.availabilityNotes && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-emerald-700" /> Appointment Visit Availability
                      </span>
                      <p className="text-xs text-emerald-800">
                        {room.availabilityNotes}
                      </p>
                    </div>
                  )}

                  {/* Amenities */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2">Amenities Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities && room.amenities.length > 0 ? (
                        room.amenities.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {a.replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No specific amenities listed.</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {room.description && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 mb-1">Space Description</h3>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {room.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <p className="text-sm">No room details listed yet.</p>
                  <Button size="sm" onClick={openEditRoom}>
                    Add Room Listing
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* SEEKER LAYOUT: Personal Details & Search Preferences Cards */
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Personal Profile & Verification */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="p-6 text-center space-y-4 border border-slate-200 shadow-sm">
              <div className="relative inline-block mx-auto group">
                {userProfile.selfieUrl ? (
                  <img
                    src={userProfile.selfieUrl}
                    alt={userProfile.firstName}
                    className="h-28 w-28 rounded-full object-cover border-4 border-emerald-500 shadow"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-3xl flex items-center justify-center border-4 border-emerald-500 shadow">
                    {userProfile.firstName ? userProfile.firstName[0].toUpperCase() : 'U'}
                  </div>
                )}

                <label
                  htmlFor="seeker-profile-image-upload"
                  className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                  title="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="seeker-profile-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePhotoUpload}
                  />
                </label>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {userProfile.firstName} {userProfile.lastName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{userProfile.email}</p>
              </div>

              {/* Verification & Role Badges */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {/* STRICT VERIFICATION STATUS BADGE */}
                {userProfile.identityVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ✓ Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    <XCircle className="h-3.5 w-3.5 text-amber-600" />
                    Not Verified
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleOpenRoleSwitchModal}
                  disabled={switchingRole}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 hover:bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 capitalize transition cursor-pointer"
                  title="Click to switch role to Host"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Role: Seeker (Click to Switch)</span>
                </button>
              </div>
            </Card>

            <Card className="p-5 space-y-4 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Personal Details
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date of Birth
                  </span>
                  <span className="font-semibold text-slate-800">{userProfile.dob || 'Not specified'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" /> Gender
                  </span>
                  <span className="font-semibold text-slate-800 capitalize">{userProfile.gender || 'Not specified'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Occupation
                  </span>
                  <span className="font-semibold text-slate-800 capitalize">{(userProfile.occupation || '').replace('_', ' ') || 'Not specified'}</span>
                </div>

                {userProfile.bio && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block mb-1 font-medium">Bio</span>
                    <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{userProfile.bio}"
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Account Security Card */}
            <Card className="p-5 space-y-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-600" /> Account Security
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Keep your account secure with a strong and updated password.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold justify-center"
                leftIcon={<Lock className="h-3.5 w-3.5" />}
                onClick={() => {
                  setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setChangePasswordError(null);
                  setIsChangePasswordOpen(true);
                }}
              >
                Change Password
              </Button>
            </Card>
          </div>

          {/* Right Column: Seeker Preferences & Lifestyle */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6 space-y-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                      Home Search Preferences
                    </h2>
                    {userProfile.role === 'seeker' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        🟢 Active Seeking Post
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        🔴 Post Inactive (Disabled)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Your desired location, room budget, and required amenities</p>
                </div>

                <Button size="sm" variant="outline" leftIcon={<Edit3 className="h-4 w-4" />} onClick={openEditSeeker}>
                  Edit Search Preferences
                </Button>
              </div>

              {seekerPref ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Preferred Location
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {seekerPref.preferredLocation}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Max Monthly Budget
                      </span>
                      <p className="font-bold text-emerald-700 text-sm">
                        ₹{seekerPref.maxBudget} /mo
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Home className="h-3.5 w-3.5 text-emerald-600" /> Room Type Pref
                      </span>
                      <p className="font-bold text-slate-900 capitalize text-sm">
                        {(seekerPref.roomTypePreference || '').replace('_', ' ') || 'Any'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2">Required Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {seekerPref.requiredAmenities && seekerPref.requiredAmenities.length > 0 ? (
                        seekerPref.requiredAmenities.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {(a || '').replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No specific required amenities selected.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <p className="text-sm">No search preferences defined yet.</p>
                  <Button size="sm" onClick={openEditSeeker}>
                    Add Search Preferences
                  </Button>
                </div>
              )}
            </Card>

            {/* Lifestyle & Living Habits */}
            <Card className="p-6 space-y-4 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Living Habits & Lifestyle
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Smoking</span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">{lifestyle.smoking || 'never'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Drinking</span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">{lifestyle.drinking || 'never'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sleep Schedule</span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">{(lifestyle.sleepSchedule || '').replace('_', ' ') || 'flexible'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Diet</span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">{(lifestyle.diet || '').replace('_', ' ') || 'anything'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cleanliness</span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">{(lifestyle.cleanliness || '').replace('_', ' ') || 'very clean'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Visitor Policy</span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">{(lifestyle.visitorPolicy || '').replace('_', ' ') || 'flexible'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Personal & Lifestyle Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProfileUpdateSubmit} className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    min={MIN_DOB}
                    max={MAX_DOB}
                    required
                    value={editProfileForm.dob}
                    error={profileDobError || undefined}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditProfileForm({ ...editProfileForm, dob: val });
                      setProfileDobError(validateDob(val));
                    }}
                  />
                  {profileDobError && (
                    <p className="mt-1 text-xs text-rose-500">{profileDobError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={editProfileForm.gender}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, gender: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <select
                  id="occupation"
                  value={editProfileForm.occupation}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, occupation: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="working_professional">Working Professional</option>
                  <option value="freelancer">Freelancer / Self-Employed</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="bio">Short Bio</Label>
                <textarea
                  id="bio"
                  rows={2}
                  value={editProfileForm.bio}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2">Lifestyle Habits</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="smoking">Smoking</Label>
                    <select
                      id="smoking"
                      value={editProfileForm.smoking}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, smoking: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                    >
                      <option value="never">Never</option>
                      <option value="socially">Socially</option>
                      <option value="regularly">Regularly</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="drinking">Drinking</Label>
                    <select
                      id="drinking"
                      value={editProfileForm.drinking}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, drinking: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                    >
                      <option value="never">Never</option>
                      <option value="socially">Socially</option>
                      <option value="regularly">Regularly</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="sleepSchedule">Sleep Schedule</Label>
                    <select
                      id="sleepSchedule"
                      value={editProfileForm.sleepSchedule}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, sleepSchedule: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                    >
                      <option value="early_bird">Early Bird</option>
                      <option value="night_owl">Night Owl</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="cleanliness">Cleanliness</Label>
                    <select
                      id="cleanliness"
                      value={editProfileForm.cleanliness}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, cleanliness: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                    >
                      <option value="very_clean">Very Clean</option>
                      <option value="moderate">Moderate</option>
                      <option value="relaxed">Relaxed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2" isLoading={submitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {isEditRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Host Room Listing</h3>
              <button
                type="button"
                onClick={() => setIsEditRoomOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRoomUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <Label htmlFor="roomType">Room Type</Label>
                <select
                  id="roomType"
                  value={editRoomForm.roomType}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, roomType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 shadow-sm"
                >
                  <option value="private_bedroom">Private Bedroom</option>
                  <option value="shared_room">Shared Bedroom</option>
                  <option value="apartment">Full Apartment</option>
                  <option value="studio">Studio Apartment</option>
                  <option value="penthouse">Penthouse</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="monthlyRent">Monthly Rent (₹)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    min="500"
                    required
                    value={editRoomForm.monthlyRent}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, monthlyRent: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="location">City / Location</Label>
                  <Input
                    id="location"
                    type="text"
                    required
                    value={editRoomForm.location}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="capacity">Capacity / Vacant Count</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="50"
                    value={editRoomForm.capacity}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, capacity: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="availabilityNotes">Visit Slot Availability</Label>
                  <Input
                    id="availabilityNotes"
                    type="text"
                    value={editRoomForm.availabilityNotes}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, availabilityNotes: e.target.value })}
                  />
                </div>
              </div>

              {/* Add Room Photos */}
              <div>
                <Label>Add More Photos (Optional)</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {editRoomForm.imagesBase64.map((img, idx) => (
                    <div key={idx} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200">
                      <img src={img} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {editRoomForm.imagesBase64.length < 5 && (
                    <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-emerald-50 text-slate-400">
                      <Upload className="h-4 w-4" />
                      <span className="text-[9px] text-emerald-700">Add</span>
                      <input type="file" accept="image/*" multiple onChange={handleRoomImagesChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Space Description</Label>
                <textarea
                  id="description"
                  rows={2}
                  value={editRoomForm.description}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 shadow-sm resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditRoomOpen(false)}
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2" isLoading={submitting}>
                  Save Room Listing
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SEEKER PREFERENCES MODAL */}
      {isEditSeekerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Search Preferences</h3>
              <button
                type="button"
                onClick={() => setIsEditSeekerOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSeekerUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <Label htmlFor="preferredLocation">Preferred City / Location</Label>
                <Input
                  id="preferredLocation"
                  type="text"
                  required
                  value={editSeekerForm.preferredLocation}
                  onChange={(e) => setEditSeekerForm({ ...editSeekerForm, preferredLocation: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="maxBudget">Max Monthly Budget (₹)</Label>
                  <Input
                    id="maxBudget"
                    type="number"
                    min="500"
                    required
                    value={editSeekerForm.maxBudget}
                    onChange={(e) => setEditSeekerForm({ ...editSeekerForm, maxBudget: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="roomTypePreference">Room Preference</Label>
                  <select
                    id="roomTypePreference"
                    value={editSeekerForm.roomTypePreference}
                    onChange={(e) => setEditSeekerForm({ ...editSeekerForm, roomTypePreference: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 shadow-sm"
                  >
                    <option value="any">Any Room Type</option>
                    <option value="private_bedroom">Private Bedroom</option>
                    <option value="shared_room">Shared Bedroom</option>
                    <option value="apartment">Full Apartment</option>
                    <option value="studio">Studio Apartment</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Required Amenities</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px]">
                  {AMENITY_OPTIONS.map((a) => {
                    const isChecked = editSeekerForm.requiredAmenities.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          setEditSeekerForm((prev) => ({
                            ...prev,
                            requiredAmenities: isChecked
                              ? prev.requiredAmenities.filter((item) => item !== a.id)
                              : [...prev.requiredAmenities, a.id],
                          }))
                        }
                        className={`flex items-center gap-1.5 p-2 rounded-lg border text-left ${
                          isChecked ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditSeekerOpen(false)}
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2" isLoading={submitting}>
                  Save Preferences
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ROLE SWITCH MODAL */}
      {isRoleSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsRoleSwitchModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Confirm Role Switch
                </h3>
                <p className="text-xs text-slate-500">
                  Switching active role from <span className="font-bold text-slate-800 capitalize">{userProfile.role}</span> to{' '}
                  <span className="font-bold text-emerald-700 capitalize">
                    {userProfile.role === 'host' ? 'Room Seeker' : 'Room Host'}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 text-xs text-amber-900 space-y-2 leading-relaxed">
              <p className="font-semibold">
                ⚠️ <strong>Notice:</strong> If you switch your role to{' '}
                <strong className="underline decoration-amber-500">
                  {userProfile.role === 'host' ? 'Room Seeker' : 'Room Host'}
                </strong>
                , your existing{' '}
                <strong className="underline decoration-amber-500">
                  {userProfile.role === 'host' ? 'Host Room Listing' : 'Room Seeker Search Preference'}
                </strong>{' '}
                post will be <strong className="text-red-700 font-extrabold">disabled and hidden</strong> from all other users until you switch your role back to{' '}
                <strong className="capitalize">{userProfile.role}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRoleSwitchModalOpen(false)}
                className="text-slate-600 border-slate-300 text-xs font-semibold"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={switchingRole}
                onClick={executeRoleSwitch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
              >
                {switchingRole ? 'Switching Role...' : 'Confirm & Switch Role'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Change Password
                </h3>
                <p className="text-xs text-slate-500">
                  Update your account password to stay secure
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {changePasswordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {changePasswordError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={changePasswordForm.currentPassword}
                  onChange={(e) => {
                    setChangePasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }));
                    setChangePasswordError(null);
                  }}
                  placeholder="Enter current password (if set)"
                  autoComplete="current-password"
                />
                <p className="text-[11px] text-slate-400">
                  Leave blank if you registered via Google and have no password set.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => {
                    setChangePasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
                    setChangePasswordError(null);
                  }}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />
                <PasswordStrength password={changePasswordForm.newPassword} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => {
                    setChangePasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                    setChangePasswordError(null);
                  }}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="text-slate-600 border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isChangingPassword}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
