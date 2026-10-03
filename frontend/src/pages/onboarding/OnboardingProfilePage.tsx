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
import { Calendar, ArrowRight, ArrowLeft, CheckCircle2, Upload, Camera, FileText } from 'lucide-react';

// Browser Image Compressor helper function to compress photos before upload
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

export default function OnboardingProfilePage() {
  const { user, loginSuccess } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 State: Personal Profile
  const [profile, setProfile] = useState({
    dob: '',
    gender: 'male',
    occupation: 'student',
    bio: '',
  });

  // Step 2 State: Lifestyle & Habits
  const [lifestyle, setLifestyle] = useState({
    smoking: 'never',
    drinking: 'never',
    sleepSchedule: 'flexible',
    diet: 'anything',
    cleanliness: 'very_clean',
    visitorPolicy: 'flexible',
    roommateGenderPref: 'any',
  });

  // Step 3 State: Identity Images
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const handleIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setIdCardPreview(compressedBase64);
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
        const compressedBase64 = await compressImage(file);
        setSelfiePreview(compressedBase64);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setSelfiePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("User session not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onboardingService.updateProfile(user.id, profile);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to update profile.");
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save lifestyle preferences.");
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
      setError("Please upload both your ID Card and a Selfie image.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onboardingService.uploadIdentity(user.id, idCardPreview, selfiePreview);
      
      // Update local auth context user to reflect isOnboarded = true
      if (user) {
        loginSuccess(localStorage.getItem('kuday_token') || '', {
          ...user,
          isOnboarded: true,
        });
      }

      toast.success("Profile & Identity Verification Completed!");
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Verification upload timed out or failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (step === 1) return "Personal Profile Setup";
    if (step === 2) return "Habits & Lifestyle Preferences";
    return "Identity Verification";
  };

  const getSubtitle = () => {
    if (step === 1) return "Step 1 of 3: Help potential roommates get to know you better";
    if (step === 2) return "Step 2 of 3: Set your living habits to find your best roommate match";
    return "Step 3 of 3: Upload your Government ID & Selfie for verified badge";
  };

  return (
    <AuthLayout title={getTitle()} subtitle={getSubtitle()}>
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-emerald-700">
            <span>
              {step === 1 && "1. Personal Details"}
              {step === 2 && "2. Lifestyle & Habits"}
              {step === 3 && "3. Identity Verification"}
            </span>
            <span>Step {step} of 3</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 ease-in-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <div className="relative mt-1.5">
                <Input
                  id="dob"
                  type="date"
                  required
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  leftIcon={<Calendar className="h-4 w-4" />}
                />
              </div>
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

        {step === 3 && (
          <form onSubmit={handleIdentitySubmit} className="space-y-5">
            {/* ID Card Upload Card */}
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

            {/* Selfie Upload Card */}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Camera className="h-5 w-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Live Selfie Image</h4>
                  <p className="text-xs text-slate-500">Upload a clear selfie photo for identity match</p>
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
                  {loading ? "Verifying & Completing Setup..." : "Complete & Verify Identity"}
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
