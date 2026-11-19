import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  MessageSquare,
  FileText,
  Calendar,
  Home,
  MapPin,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  X,
  XCircle,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { agreementService } from '@/services/agreementService';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorHandler';
import type { ActiveRoommateResponse } from '@/types/agreement.types';

interface YourRoommateSectionProps {
  roommate: ActiveRoommateResponse | ActiveRoommateResponse[] | null;
  onAgreementEnded?: () => void;
}

export const YourRoommateSection: React.FC<YourRoommateSectionProps> = ({
  roommate,
  onAgreementEnded,
}) => {
  const navigate = useNavigate();

  const [confirmTarget, setConfirmTarget] = useState<{
    agreementId: string;
    partnerName: string;
  } | null>(null);
  const [terminationReason, setTerminationReason] = useState('');
  const [submittingTermination, setSubmittingTermination] = useState(false);

  const roommatesList: ActiveRoommateResponse[] = Array.isArray(roommate)
    ? roommate
    : roommate
    ? [roommate]
    : [];

  if (roommatesList.length === 0) {
    return null;
  }

  const handleMessage = (partnerId: string, partnerName: string) => {
    navigate(ROUTES.MESSAGES, {
      state: {
        recipientId: partnerId,
        recipientName: partnerName,
      },
    });
  };

  const handleViewAgreement = (agreementId: string) => {
    navigate(ROUTES.AGREEMENT.replace(':agreementId', agreementId));
  };

  const handleConfirmTerminate = async () => {
    if (!confirmTarget || submittingTermination) return;

    try {
      setSubmittingTermination(true);
      await agreementService.terminateAgreement(
        confirmTarget.agreementId,
        'ended',
        terminationReason.trim() || 'Agreement ended by mutual completion'
      );

      toast.success(
        'Agreement ended successfully',
        'The vacancy slot has been restored and status updated.'
      );
      setConfirmTarget(null);
      setTerminationReason('');
      onAgreementEnded?.();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to end agreement');
    } finally {
      setSubmittingTermination(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {roommatesList.length > 1 ? 'Your Active Roommates & Tenants' : 'Your Roommate'}
            </h2>
            <p className="text-xs text-slate-500">
              Active rental agreement partner{roommatesList.length > 1 ? 's' : ''} and living arrangement details
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          {roommatesList.length} Active {roommatesList.length > 1 ? 'Agreements' : 'Agreement'}
        </span>
      </div>

      <div className="space-y-5">
        {roommatesList.map((item) => {
          const { partner, room, commonTerms, agreementId, startDate, endDate } = item;
          const partnerName =
            [partner.firstName, partner.lastName].filter(Boolean).join(' ') || 'Roommate';

          return (
            <div
              key={agreementId}
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:shadow-md"
            >
              <div className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  {/* Roommate Profile */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {partner.selfieUrl ? (
                        <img
                          src={partner.selfieUrl}
                          alt={partnerName}
                          className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xl shadow-xs">
                          {partner.firstName?.charAt(0).toUpperCase() || 'R'}
                        </div>
                      )}
                      {partner.identityVerified && (
                        <span
                          className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-emerald-600 shadow-xs"
                          title="Verified Identity"
                        >
                          <CheckCircle2 className="h-5 w-5 fill-emerald-100" />
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {partnerName}
                        </h3>
                        {partner.identityVerified && (
                          <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">
                        {partner.occupation || partner.role || 'Roommate'} • {partner.email}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleMessage(partner.id, partnerName)}
                      className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewAgreement(agreementId)}
                      className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget({ agreementId, partnerName })}
                      className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      End Agreement
                    </button>
                  </div>
                </div>

                {/* Room & Agreement Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                  <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Home className="h-3.5 w-3.5 text-slate-400" />
                      <span>Room</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {room.title || room.roomType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {room.location}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                      <span>Monthly Rent</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      ₹{commonTerms.rent.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-500">/ month</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Deposit: ₹{commonTerms.deposit.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Move-in Date</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      {commonTerms.moveInDate || startDate || 'Active'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Duration: {commonTerms.durationMonths} months
                      {endDate ? ` (until ${endDate})` : ''}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Utilities &amp; Terms</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {commonTerms.utilities || 'Included per agreement'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      Both parties agreed &amp; signed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Ending Agreement */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertTriangle className="h-5 w-5" />
                <span>End Rental Agreement</span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <p>
                Are you sure you want to end this rental agreement with{' '}
                <strong className="text-slate-900">{confirmTarget.partnerName}</strong>?
              </p>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 text-xs leading-relaxed">
                <strong>Important Notice:</strong> The agreement fee is{' '}
                <span className="font-bold underline">not refunded</span> upon termination.
                Ending the agreement will release 1 vacancy slot back to the room.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for ending (optional)
                </label>
                <input
                  type="text"
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  placeholder="e.g. Tenancy concluded, moving out..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={submittingTermination}
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingTermination}
                onClick={handleConfirmTerminate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingTermination ? 'Ending Agreement...' : 'Yes, End Agreement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
