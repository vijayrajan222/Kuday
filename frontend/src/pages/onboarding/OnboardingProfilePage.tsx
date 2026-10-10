import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { onboardingService } from '@/services/onboardingService';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorHandler';
import {
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Camera,
  FileText,
  Home,
  UserCheck,
  DollarSign,
  MapPin,
  Users,
  Clock,
  LogOut,
} from 'lucide-react';

// Available Amenities options for checklist
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

// Helper to compress photos in browser canvas before sending payload
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

function getLocalDateString(yearsAgo = 0): string {
  const d = new Date();
  if (yearsAgo > 0) {
    d.setFullYear(d.getFullYear() - yearsAgo);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const MAX_DOB = getLocalDateString(18); // Must be at least 18 years old
export const MIN_DOB = getLocalDateString(100); // Max reasonable age 100

export function validateDob(dateStr: string): string | null {
  if (!dateStr) return "Date of birth is required.";
  const selected = new Date(dateStr);
  if (isNaN(selected.getTime())) return "Please enter a valid date.";

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (selected > today) {
    return "Date of birth cannot be in the future.";
  }

  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  eighteenYearsAgo.setHours(23, 59, 59, 999);
  if (selected > eighteenYearsAgo) {
    return "You must be at least 18 years old to use this platform.";
  }

  const hundredYearsAgo = new Date();
  hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
  if (selected < hundredYearsAgo) {
    return "Please enter a realistic date of birth within the last 100 years.";
  }

  return null;
}

export default function OnboardingProfilePage() {
  const { user, loginSuccess, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user || !user.id) {
      toast.error("User session expired or not found. Please log in again.");
      logout();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [user, logout, navigate]);

  const handleLogout = () => {
    try {
      logout();
      toast.success("Logged out successfully");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      toast.error("Failed to log out");
    }
  };

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedRole, setSelectedRole] = useState<'host' | 'seeker' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);

  // Step 1: Personal Profile
  const [profile, setProfile] = useState({
    dob: '',
    gender: 'male',
    occupation: 'student',
    bio: '',
  });

  // Step 2: Lifestyle & Habits
  const [lifestyle, setLifestyle] = useState({
    smoking: 'never',
    drinking: 'never',
    sleepSchedule: 'flexible',
    diet: 'anything',
    cleanliness: 'very_clean',
    visitorPolicy: 'flexible',
    roommateGenderPref: 'any',
  });

  // Step 3: Identity Uploads
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Step 5 Host: Room Details Form
  const [roomData, setRoomData] = useState({
    roomType: 'private_bedroom',
    monthlyRent: '',
    location: '',
    capacity: '1',
    availabilityNotes: '',
    description: '',
    amenities: [] as string[],
    imagesBase64: [] as string[],
  });

  // Step 5 Seeker: Search Preferences Form
  const [seekerData, setSeekerData] = useState({
    preferredLocation: '',
    maxBudget: '',
    roomTypePreference: 'any',
    requiredAmenities: [] as string[],
  });

  const handleIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setIdCardPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setIdCardPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSelfieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setSelfiePreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setSelfiePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRoomImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxFiles = Math.min(files.length, 5 - roomData.imagesBase64.length);
    const newImages: string[] = [];

    for (let i = 0; i < maxFiles; i++) {
      try {
        const compressed = await compressImage(files[i]);
        newImages.push(compressed);
      } catch {
        // Fallback
      }
    }
    setRoomData((prev) => ({
      ...prev,
      imagesBase64: [...prev.imagesBase64, ...newImages],
    }));
  };

  const toggleRoomAmenity = (amenityId: string) => {
    setRoomData((prev) => {
      const exists = prev.amenities.includes(amenityId);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenityId)
          : [...prev.amenities, amenityId],
      };
    });
  };

  const toggleSeekerAmenity = (amenityId: string) => {
    setSeekerData((prev) => {
      const exists = prev.requiredAmenities.includes(amenityId);
      return {
        ...prev,
        requiredAmenities: exists
          ? prev.requiredAmenities.filter((a) => a !== amenityId)
          : [...prev.requiredAmenities, amenityId],
      };
    });
  };

  // Submit Handlers for Steps
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("User session not found. Please log in again.");
      return;
    }
    const dobValidation = validateDob(profile.dob);
    if (dobValidation) {
      setDobError(dobValidation);
      setError(dobValidation);
      return;
    }
    setDobError(null);
    try {
      setLoading(true);
      setError(null);
      await onboardingService.updateProfile(user.id, profile);
      setStep(2);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLifestyleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("User session not found. Please log in again.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onboardingService.saveLifestyle({
        userId: user.id,
        ...lifestyle,
      });
      setStep(3);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("User session not found. Please log in again.");
      return;
    }
    if (!idCardPreview || !selfiePreview) {
      setError("Please upload both your ID Card and a Selfie photo to continue.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onboardingService.uploadIdentity(user.id, idCardPreview, selfiePreview);
      setStep(4);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: 'host' | 'seeker') => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      setSelectedRole(role);
      await onboardingService.updateRole(user.id, role);
      setStep(5);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleHostFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!roomData.location || roomData.location.trim().length < 2) {
      setError("Please provide a valid city / location (at least 2 characters).");
      return;
    }
    const rentNum = Number(roomData.monthlyRent);
    if (!roomData.monthlyRent || isNaN(rentNum) || rentNum < 500) {
      setError("Please enter a valid monthly rent (minimum ₹500).");
      return;
    }
    const capNum = Number(roomData.capacity);
    if (isNaN(capNum) || capNum < 1 || capNum > 50) {
      setError("Vacant capacity must be between 1 and 50 persons.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onboardingService.createRoom({
        hostId: user.id,
        roomType: roomData.roomType,
        monthlyRent: rentNum,
        location: roomData.location.trim(),
        capacity: capNum || 1,
        availabilityNotes: roomData.availabilityNotes,
        amenities: roomData.amenities,
        imagesBase64: roomData.imagesBase64,
        description: roomData.description,
      });

      // Update Auth context to isOnboarded = true
      loginSuccess(localStorage.getItem('kuday_token') || '', {
        ...user,
        role: 'host',
        isOnboarded: true,
      });

      toast.success("Host Room Profile Created Successfully!");
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSeekerFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!seekerData.preferredLocation || seekerData.preferredLocation.trim().length < 2) {
      setError("Please provide a valid preferred city / location (at least 2 characters).");
      return;
    }
    const budgetNum = Number(seekerData.maxBudget);
    if (!seekerData.maxBudget || isNaN(budgetNum) || budgetNum < 500) {
      setError("Please enter a valid maximum monthly budget (minimum ₹500).");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onboardingService.saveSeekerPreferences({
        userId: user.id,
        preferredLocation: seekerData.preferredLocation.trim(),
        maxBudget: budgetNum,
        roomTypePreference: seekerData.roomTypePreference,
        requiredAmenities: seekerData.requiredAmenities,
      });

      // Update Auth context to isOnboarded = true
      loginSuccess(localStorage.getItem('kuday_token') || '', {
        ...user,
        role: 'seeker',
        isOnboarded: true,
      });

      toast.success("Seeker Search Preferences Saved Successfully!");
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (step === 1) return "Personal Profile Setup";
    if (step === 2) return "Habits & Lifestyle Preferences";
    if (step === 3) return "Identity Verification";
    if (step === 4) return "Choose Your Role";
    return selectedRole === 'host' ? "Build Your Room Profile" : "Refine Your Home Search";
  };

  const getSubtitle = () => {
    if (step === 1) return "Step 1 of 5: Help potential roommates get to know you better";
    if (step === 2) return "Step 2 of 5: Set living preferences for your best roommate match";
    if (step === 3) return "Step 3 of 5: Upload Government ID & Selfie for verified status";
    if (step === 4) return "Step 4 of 5: Are you offering a space or searching for a home?";
    return selectedRole === 'host'
      ? "Step 5 of 5: Add your room details, rent, location, and amenities"
      : "Step 5 of 5: Set your budget, location, and preferred living style";
  };

  return (
    <AuthLayout
      title={getTitle()}
      subtitle={getSubtitle()}
      footer={
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <span>Need to switch account?</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 hover:underline"
          >
            <LogOut className="h-3.5 w-3.5" />
            Switch User / Log out
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-emerald-700">
            <span>
              {step === 1 && "1. Personal Details"}
              {step === 2 && "2. Lifestyle & Habits"}
              {step === 3 && "3. Identity Verification"}
              {step === 4 && "4. Role Selection"}
              {step === 5 && (selectedRole === 'host' ? "5. Room Listing Setup" : "5. Search Preferences")}
            </span>
            <span>Step {step} of 5</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 ease-in-out"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STEP 1: Personal Profile Details */}
        {step === 1 && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <div className="relative mt-1.5">
                <Input
                  id="dob"
                  type="date"
                  max={MAX_DOB}
                  min={MIN_DOB}
                  required
                  value={profile.dob}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, dob: val });
                    const valErr = validateDob(val);
                    setDobError(valErr);
                    if (valErr) {
                      setError(valErr);
                    } else {
                      setError(null);
                    }
                  }}
                  error={dobError || undefined}
                  leftIcon={<Calendar className="h-4 w-4" />}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Must be at least 18 years old (born on or before {MAX_DOB}).
              </p>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <select
                id="occupation"
                value={profile.occupation}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                rows={3}
                placeholder="Share a little about yourself, your hobbies, or daily routine..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            <Button type="submit" size="lg" fullWidth isLoading={loading}>
              <span className="flex items-center justify-center gap-2">
                {loading ? "Saving Profile..." : "Next: Habits & Lifestyle"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </span>
            </Button>
          </form>
        )}

        {/* STEP 2: Lifestyle & Habits */}
        {step === 2 && (
          <form onSubmit={handleLifestyleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="smoking">Smoking</Label>
                <select
                  id="smoking"
                  value={lifestyle.smoking}
                  onChange={(e) => setLifestyle({ ...lifestyle, smoking: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                  value={lifestyle.drinking}
                  onChange={(e) => setLifestyle({ ...lifestyle, drinking: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                  value={lifestyle.sleepSchedule}
                  onChange={(e) => setLifestyle({ ...lifestyle, sleepSchedule: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="early_bird">Early Bird</option>
                  <option value="night_owl">Night Owl</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <Label htmlFor="diet">Diet Preference</Label>
                <select
                  id="diet"
                  value={lifestyle.diet}
                  onChange={(e) => setLifestyle({ ...lifestyle, diet: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non_veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="anything">Flexible / Anything</option>
                </select>
              </div>

              <div>
                <Label htmlFor="cleanliness">Cleanliness</Label>
                <select
                  id="cleanliness"
                  value={lifestyle.cleanliness}
                  onChange={(e) => setLifestyle({ ...lifestyle, cleanliness: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="very_clean">Very Clean</option>
                  <option value="moderate">Moderate</option>
                  <option value="relaxed">Relaxed</option>
                </select>
              </div>

              <div>
                <Label htmlFor="visitorPolicy">Visitor Policy</Label>
                <select
                  id="visitorPolicy"
                  value={lifestyle.visitorPolicy}
                  onChange={(e) => setLifestyle({ ...lifestyle, visitorPolicy: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="no_visitors">No Visitors</option>
                  <option value="weekend_only">Weekend Only</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="roommateGenderPref">Roommate Gender Preference</Label>
              <select
                id="roommateGenderPref"
                value={lifestyle.roommateGenderPref}
                onChange={(e) => setLifestyle({ ...lifestyle, roommateGenderPref: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="any">Any Gender</option>
                <option value="same_gender">Same Gender Only</option>
                <option value="male_only">Male Only</option>
                <option value="female_only">Female Only</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="w-1/3"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button type="submit" size="lg" className="w-2/3" isLoading={loading}>
                <span className="flex items-center justify-center gap-2">
                  {loading ? "Saving..." : "Next: Upload Verification"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </span>
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Identity Verification Uploads */}
        {step === 3 && (
          <form onSubmit={handleIdentitySubmit} className="space-y-5">
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Government / Student ID Card</h4>
                  <p className="text-xs text-slate-500">Upload Aadhaar, Passport, Driving License, or College ID</p>
                </div>
              </div>

              {idCardPreview ? (
                <div className="relative mt-2 rounded-xl overflow-hidden max-h-40 border border-slate-200">
                  <img src={idCardPreview} alt="ID Card Preview" className="w-full object-cover max-h-40" />
                  <button
                    type="button"
                    onClick={() => setIdCardPreview(null)}
                    className="absolute top-2 right-2 bg-slate-900/70 text-white text-xs px-2 py-1 rounded-md hover:bg-slate-900"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center cursor-pointer py-4 bg-slate-50 rounded-xl hover:bg-emerald-50/50 transition-all">
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-emerald-700">Choose ID Card Image</span>
                  <input type="file" accept="image/*" onChange={handleIdCardChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Camera className="h-5 w-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Live Selfie Image</h4>
                  <p className="text-xs text-slate-500">Upload a clear selfie photo for identity verification</p>
                </div>
              </div>

              {selfiePreview ? (
                <div className="relative mt-2 rounded-xl overflow-hidden max-h-40 border border-slate-200">
                  <img src={selfiePreview} alt="Selfie Preview" className="w-full object-cover max-h-40" />
                  <button
                    type="button"
                    onClick={() => setSelfiePreview(null)}
                    className="absolute top-2 right-2 bg-slate-900/70 text-white text-xs px-2 py-1 rounded-md hover:bg-slate-900"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center cursor-pointer py-4 bg-slate-50 rounded-xl hover:bg-emerald-50/50 transition-all">
                  <Camera className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-emerald-700">Choose Selfie Photo</span>
                  <input type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="w-1/3"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button type="submit" size="lg" className="w-2/3" isLoading={loading}>
                <span className="flex items-center justify-center gap-2">
                  {loading ? "Verifying Uploads..." : "Next: Select Your Role"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </span>
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Select Role (Become a Host vs Find a Host / Seeker) */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              Please choose how you will be using Kuday to continue your setup:
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('host')}
                disabled={loading}
                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-white p-6 text-center shadow-sm hover:border-emerald-600 hover:bg-emerald-50/40 transition-all"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                  <Home className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Become a Host</h3>
                <p className="mt-1 text-xs text-slate-500">
                  I have a room / apartment available and want to list it to find compatible roommates.
                </p>
                <span className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  Select Host <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('seeker')}
                disabled={loading}
                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-white p-6 text-center shadow-sm hover:border-emerald-600 hover:bg-emerald-50/40 transition-all"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Find a Host</h3>
                <p className="mt-1 text-xs text-slate-500">
                  I am looking for a place to stay and want to discover listed rooms & compatible hosts.
                </p>
                <span className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  Select Seeker <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>

            <div className="flex justify-start pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="w-1/3"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5 (HOST): Room Listing Details Setup */}
        {step === 5 && selectedRole === 'host' && (
          <form onSubmit={handleHostFinalSubmit} className="space-y-4">
            <div>
              <Label htmlFor="roomType">Room Type</Label>
              <div className="relative mt-1.5">
                <select
                  id="roomType"
                  value={roomData.roomType}
                  onChange={(e) => setRoomData({ ...roomData, roomType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="private_bedroom">Private Bedroom</option>
                  <option value="shared_room">Shared Bedroom</option>
                  <option value="apartment">Full Apartment</option>
                  <option value="studio">Studio Apartment</option>
                  <option value="penthouse">Penthouse</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="monthlyRent">Monthly Rent (₹)</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="monthlyRent"
                    type="number"
                    min="500"
                    required
                    placeholder="e.g. 12000"
                    value={roomData.monthlyRent}
                    onChange={(e) => setRoomData({ ...roomData, monthlyRent: e.target.value })}
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">City / Location</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="location"
                    type="text"
                    required
                    placeholder="e.g. Bangalore, Indiranagar"
                    value={roomData.location}
                    onChange={(e) => setRoomData({ ...roomData, location: e.target.value })}
                    leftIcon={<MapPin className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="capacity">Vacant Count / Capacity</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={roomData.capacity}
                    onChange={(e) => setRoomData({ ...roomData, capacity: e.target.value })}
                    leftIcon={<Users className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="availabilityNotes">Visit Slot Availability</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="availabilityNotes"
                    type="text"
                    placeholder="e.g. Available on weekends"
                    value={roomData.availabilityNotes}
                    onChange={(e) => setRoomData({ ...roomData, availabilityNotes: e.target.value })}
                    leftIcon={<Clock className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>

            {/* Room Images (up to 5) */}
            <div>
              <Label>Room Photos (Up to 5)</Label>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {roomData.imagesBase64.map((img, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={img} alt={`Room ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setRoomData((prev) => ({
                          ...prev,
                          imagesBase64: prev.imagesBase64.filter((_, i) => i !== idx),
                        }))
                      }
                      className="absolute top-1 right-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {roomData.imagesBase64.length < 5 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-[10px] font-medium text-emerald-700 mt-1">Add Photo</span>
                    <input type="file" accept="image/*" multiple onChange={handleRoomImagesChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Amenities Checklist */}
            <div>
              <Label>Amenities Checklist</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {AMENITY_OPTIONS.map((amenity) => {
                  const isChecked = roomData.amenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleRoomAmenity(amenity.id)}
                      className={`flex items-center gap-2 rounded-xl p-2.5 text-left border transition-all ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-md border flex items-center justify-center ${isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                        {isChecked && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Space Description</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe your property, rules, house vibe, or nearby transport..."
                value={roomData.description}
                onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(4)}
                className="w-1/3"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button type="submit" size="lg" className="w-2/3" isLoading={loading}>
                <span className="flex items-center justify-center gap-2">
                  {loading ? "Creating Listing..." : "Finish & Publish Room"}
                  {!loading && <CheckCircle2 className="h-4 w-4" />}
                </span>
              </Button>
            </div>
          </form>
        )}

        {/* STEP 5 (SEEKER): Search Preferences Setup */}
        {step === 5 && selectedRole === 'seeker' && (
          <form onSubmit={handleSeekerFinalSubmit} className="space-y-4">
            <div>
              <Label htmlFor="preferredLocation">Preferred City / Location</Label>
              <div className="relative mt-1.5">
                <Input
                  id="preferredLocation"
                  type="text"
                  required
                  placeholder="e.g. Bangalore, Indiranagar, Koramangala"
                  value={seekerData.preferredLocation}
                  onChange={(e) => setSeekerData({ ...seekerData, preferredLocation: e.target.value })}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="maxBudget">Maximum Monthly Budget (₹)</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="maxBudget"
                    type="number"
                    min="500"
                    required
                    placeholder="e.g. 15000"
                    value={seekerData.maxBudget}
                    onChange={(e) => setSeekerData({ ...seekerData, maxBudget: e.target.value })}
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="roomTypePreference">Room Type Preference</Label>
                <div className="relative mt-1.5">
                  <select
                    id="roomTypePreference"
                    value={seekerData.roomTypePreference}
                    onChange={(e) => setSeekerData({ ...seekerData, roomTypePreference: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="any">Any Room Type</option>
                    <option value="private_bedroom">Private Bedroom</option>
                    <option value="shared_room">Shared Bedroom</option>
                    <option value="apartment">Full Apartment</option>
                    <option value="studio">Studio Apartment</option>
                    <option value="penthouse">Penthouse</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Required Amenities Checklist */}
            <div>
              <Label>Required Amenities Checklist</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {AMENITY_OPTIONS.map((amenity) => {
                  const isChecked = seekerData.requiredAmenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleSeekerAmenity(amenity.id)}
                      className={`flex items-center gap-2 rounded-xl p-2.5 text-left border transition-all ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-md border flex items-center justify-center ${isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                        {isChecked && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(4)}
                className="w-1/3"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button type="submit" size="lg" className="w-2/3" isLoading={loading}>
                <span className="flex items-center justify-center gap-2">
                  {loading ? "Saving Preferences..." : "Finish & Start Searching"}
                  {!loading && <CheckCircle2 className="h-4 w-4" />}
                </span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
