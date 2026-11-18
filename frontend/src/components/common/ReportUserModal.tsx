import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/useToast';
import { reportService } from '@/services/reportService';
import { getErrorMessage } from '@/utils/errorHandler';
import type { ReportReason } from '@/types/report.types';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserRole?: string;
  reportedUserAvatar?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'harassment',
    label: 'Harassment or Abusive Behavior',
    description: 'Threats, bullying, hate speech, or aggressive communication',
  },
  {
    value: 'fake_profile_or_listing',
    label: 'Fake Profile or Misleading Listing',
    description: 'Impersonation, stolen photos, non-existent rooms, or false information',
  },
  {
    value: 'scam_fraud',
    label: 'Scam, Fraud, or Financial Extortion',
    description: 'Demanding unauthorized deposits, offline payments, or phishing attempts',
  },
  {
    value: 'inappropriate_behavior',
    label: 'Inappropriate or Offensive Conduct',
    description: 'Unsolicited explicit content, physical boundary violations, or intoxication',
  },
  {
    value: 'spam',
    label: 'Spam or Commercial Solicitation',
    description: 'Unsolicited advertising, promotional links, or repetitive nuisance messages',
  },
  {
    value: 'other',
    label: 'Other Policy Violation',
    description: 'Any other safety concern or terms of service violation',
  },
];

// Canvas helper to compress proof screenshots before transmission
function compressScreenshot(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function ReportUserModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  reportedUserRole,
  reportedUserAvatar,
  onSuccess,
}: ReportUserModalProps) {
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [message, setMessage] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB. Please choose a smaller image.');
      return;
    }

    try {
      setUploadingImage(true);
      const compressedBase64 = await compressScreenshot(file);
      setScreenshotPreview(compressedBase64);
      setScreenshotFileName(file.name);
      toast.success('Screenshot proof attached successfully!');
    } catch {
      toast.error('Failed to process image. Please try another file.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotPreview(null);
    setScreenshotFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || message.trim().length < 3) {
      toast.error('Please provide a message or reason for reporting (at least 3 characters).');
      return;
    }

    try {
      setSubmitting(true);
      await reportService.submitReport({
        reportedUserId,
        reason,
        message: message.trim(),
        screenshotBase64: screenshotPreview || undefined,
      });

      toast.success(
        'Report submitted successfully.',
        'Our trust and safety team will review this report promptly.'
      );

      // Reset state and notify caller
      setMessage('');
      setScreenshotPreview(null);
      setScreenshotFileName(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Report User</span>
                <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-bold border border-rose-200">
                  CONFIDENTIAL
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                File a safety report to the Kuday trust and moderation team
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Reported User Profile Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="h-11 w-11 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
            {reportedUserAvatar ? (
              <img
                src={reportedUserAvatar}
                alt={reportedUserName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-800 text-white font-bold text-sm">
                {reportedUserName ? reportedUserName[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">{reportedUserName}</h4>
            <p className="text-[11px] text-slate-500 capitalize">
              Role: <strong className="text-slate-700">{reportedUserRole || 'Member'}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <Flag className="h-3 w-3" />
              <span>Target Account</span>
            </span>
          </div>
        </div>

        {/* Report Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="report-reason" className="text-xs font-bold text-slate-800">
              Reason for Reporting <span className="text-rose-500">*</span>
            </Label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none"
              required
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              {REPORT_REASONS.find((r) => r.value === reason)?.description}
            </p>
          </div>

          {/* Detailed Explanation Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="report-message" className="text-xs font-bold text-slate-800">
                Detailed Explanation / Message <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[10px] text-slate-400">
                {message.trim().length} characters
              </span>
            </div>
            <textarea
              id="report-message"
              rows={4}
              required
              minLength={3}
              placeholder="Describe what occurred with specific details (e.g. date, messages exchanged, misleading claims, or safety violations)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Screenshot / Proof Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-slate-500" />
                <span>Screenshot Proof (Optional Evidence)</span>
              </span>
              {screenshotPreview && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Attached
                </span>
              )}
            </Label>

            {screenshotPreview ? (
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-3 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={screenshotPreview}
                    alt="Proof preview"
                    className="h-14 w-14 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {screenshotFileName || 'proof_screenshot.jpg'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Ready for upload to moderation
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemoveScreenshot}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs h-8 px-2.5"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 p-4 text-center bg-slate-50/60 hover:bg-indigo-50/20 transition-all space-y-1.5"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="h-9 w-9 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center mx-auto transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">
                  {uploadingImage ? 'Compressing image...' : 'Click to attach a screenshot proof'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Screenshots of chat conversations, payment requests, or fake photos (up to 15MB)
                </p>
              </div>
            )}
          </div>

          {/* Privacy & Confidentiality Notice */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-slate-700 text-[11px] flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Your identity is protected:</strong> All reports are kept strictly confidential and reviewed by authorized administrators. The user being reported will never know who filed this report.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 cursor-pointer"
              leftIcon={
                submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )
              }
            >
              {submitting ? 'Submitting Report...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
