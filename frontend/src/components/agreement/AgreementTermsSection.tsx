import { useState } from "react";
import {
  Calendar,
  Clock,
  Coins,
  FileEdit,
  Check,
  X,
  ShieldAlert,
  Info,
  CheckCircle2,
  Zap,
} from "lucide-react";
import type { Agreement, CommonTerms } from "@/types/agreement.types";
import { Button } from "@/components/ui/button";

interface AgreementTermsSectionProps {
  agreement: Agreement;
  currentUserId: string;
  isHost: boolean;
  onProposeTerms: (terms: CommonTerms) => Promise<void>;
  onRespondTerms: (action: "accept" | "reject") => Promise<void>;
  updating: boolean;
}

export function AgreementTermsSection({
  agreement,
  currentUserId,
  onProposeTerms,
  onRespondTerms,
  updating,
}: AgreementTermsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CommonTerms>(agreement.commonTerms);

  const pending = agreement.pendingCommonTerms;
  const isPendingForMe = pending && pending.status === "pending" && pending.proposedBy !== currentUserId;
  const isPendingFromMe = pending && pending.status === "pending" && pending.proposedBy === currentUserId;
  const isLocked = agreement.status === "signed" || Boolean(agreement.lockedAt);

  const handleOpenEdit = () => {
    setFormData(agreement.commonTerms);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onProposeTerms(formData);
    setIsEditing(false);
  };

  const otherPartyName = currentUserId === agreement.hostId
    ? agreement.seeker?.firstName || "Roommate"
    : agreement.host?.firstName || "Host";

  return (
    <div className="space-y-6">
      {/* Pending Proposal Banner for Current User */}
      {isPendingForMe && pending && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>{otherPartyName} proposed modifications to the Common Terms</span>
              </div>
              <p className="text-xs text-amber-800">
                Please review the proposed adjustments. Both parties must mutually agree to the terms before signing.
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white/80 p-3 rounded-xl border border-amber-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Proposed Rent</span>
                  <strong className="text-slate-900 font-bold">₹{pending.terms.rent.toLocaleString("en-IN")}/mo</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Proposed Deposit</span>
                  <strong className="text-slate-900 font-bold">₹{pending.terms.deposit.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Move-in Date</span>
                  <strong className="text-slate-900 font-bold">{pending.terms.moveInDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Duration</span>
                  <strong className="text-slate-900 font-bold">{pending.terms.durationMonths} Months</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Notice Period</span>
                  <strong className="text-slate-900 font-bold">{pending.terms.noticePeriodDays} Days</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Payment Due</span>
                  <strong className="text-slate-900 font-bold">{pending.terms.paymentDueDay}th of month</strong>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => onRespondTerms("accept")}
                disabled={updating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                leftIcon={<Check className="h-3.5 w-3.5" />}
              >
                Accept Terms
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRespondTerms("reject")}
                disabled={updating}
                className="w-full border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                leftIcon={<X className="h-3.5 w-3.5" />}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Proposal Sent Banner */}
      {isPendingFromMe && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-600 shrink-0" />
            <span>
              Your proposed adjustments have been dispatched to <strong>{otherPartyName}</strong>. Awaiting their acceptance.
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-sky-200/60 text-[11px] font-bold text-sky-800">
            Awaiting Approval
          </span>
        </div>
      )}

      {/* Main Terms Grid */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Core Agreement Terms</h3>
            <p className="text-xs text-slate-500">
              Essential rental financial covenants, tenancy period, and schedule agreed between both parties.
            </p>
          </div>

          {!isLocked && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenEdit}
              disabled={updating || Boolean(isPendingForMe || isPendingFromMe)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shrink-0"
              leftIcon={<FileEdit className="h-3.5 w-3.5" />}
            >
              Propose Term Changes
            </Button>
          )}
        </div>

        {/* Covenants Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Monthly Rent */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-emerald-600" /> Monthly Rent
            </span>
            <p className="text-lg font-black text-slate-900">
              ₹{agreement.commonTerms.rent.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-slate-500 ml-1">/ month</span>
            </p>
            <span className="text-[10px] text-slate-400 block">Due on or before the {agreement.commonTerms.paymentDueDay}th</span>
          </div>

          {/* Security Deposit */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-indigo-600" /> Security Deposit
            </span>
            <p className="text-lg font-black text-slate-900">
              ₹{agreement.commonTerms.deposit.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-400 block">Refundable upon vacating minus damage dues</span>
          </div>

          {/* Move-in Date */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-sky-600" /> Commencement Date
            </span>
            <p className="text-lg font-black text-slate-900">
              {agreement.commonTerms.moveInDate}
            </p>
            <span className="text-[10px] text-slate-400 block">Official move-in &amp; key handover</span>
          </div>

          {/* Lease Duration */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-purple-600" /> Lease Term
            </span>
            <p className="text-lg font-black text-slate-900">
              {agreement.commonTerms.durationMonths} Months
            </p>
            <span className="text-[10px] text-slate-400 block">Standard renewable residential term</span>
          </div>

          {/* Notice Period */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" /> Notice Period
            </span>
            <p className="text-lg font-black text-slate-900">
              {agreement.commonTerms.noticePeriodDays} Days
            </p>
            <span className="text-[10px] text-slate-400 block">Written notice required prior to exit</span>
          </div>

          {/* Utilities */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Utilities Split
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
              {agreement.commonTerms.utilities}
            </p>
          </div>
        </div>
      </div>

      {/* Propose Terms Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Propose Common Term Adjustments</h3>
                <p className="text-xs text-slate-500">
                  Changes will be submitted to {otherPartyName} for mutual approval.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    min={500}
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: Number(e.target.value) })}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Move-in Date</label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={formData.noticePeriodDays}
                    onChange={(e) => setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Due Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.paymentDueDay}
                    onChange={(e) => setFormData({ ...formData, paymentDueDay: Number(e.target.value) })}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Utilities Split Arrangement</label>
                <textarea
                  rows={2}
                  value={formData.utilities}
                  onChange={(e) => setFormData({ ...formData, utilities: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  Send Proposal to {otherPartyName}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
