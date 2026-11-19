import {
  Calendar,
  Clock,
  Coins,
  Zap,
} from "lucide-react";
import type { CommonTerms } from "@/types/agreement.types";

interface AgreementTermsSectionProps {
  terms: CommonTerms;
  isEditable: boolean;
  onChange: (terms: CommonTerms) => void;
}

export function AgreementTermsSection({
  terms,
  isEditable,
  onChange,
}: AgreementTermsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Main Terms Container */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-black text-slate-900">Core Agreement Terms</h3>
          <p className="text-xs text-slate-500">
            {isEditable
              ? "Edit financial covenants, tenancy period, and schedule below. Changes will be submitted with your revision."
              : "Essential rental financial covenants, tenancy period, and schedule currently proposed."}
          </p>
        </div>

        {isEditable ? (
          /* Editable Form Grid */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  min={500}
                  value={terms.rent}
                  onChange={(e) => onChange({ ...terms, rent: Number(e.target.value) })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Per calendar month</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={terms.deposit}
                  onChange={(e) => onChange({ ...terms, deposit: Number(e.target.value) })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Refundable security amount</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Move-in Date
                </label>
                <input
                  type="date"
                  value={terms.moveInDate}
                  onChange={(e) => onChange({ ...terms, moveInDate: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Commencement of tenancy</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Duration (Months)
                </label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  value={terms.durationMonths}
                  onChange={(e) => onChange({ ...terms, durationMonths: Number(e.target.value) })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Total lease duration</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={terms.noticePeriodDays}
                  onChange={(e) => onChange({ ...terms, noticePeriodDays: Number(e.target.value) })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Notice before vacating</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Due Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={terms.paymentDueDay}
                  onChange={(e) => onChange({ ...terms, paymentDueDay: Number(e.target.value) })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Day of month rent is due</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Utilities Split Arrangement
              </label>
              <textarea
                rows={2}
                value={terms.utilities}
                onChange={(e) => onChange({ ...terms, utilities: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
              />
            </div>
          </div>
        ) : (
          /* Read-only Covenants Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Monthly Rent */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-600" /> Monthly Rent
              </span>
              <p className="text-lg font-black text-slate-900">
                ₹{terms.rent.toLocaleString("en-IN")}
                <span className="text-xs font-normal text-slate-500 ml-1">/ month</span>
              </p>
              <span className="text-[10px] text-slate-400 block">Due on or before the {terms.paymentDueDay}th</span>
            </div>

            {/* Security Deposit */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-indigo-600" /> Security Deposit
              </span>
              <p className="text-lg font-black text-slate-900">
                ₹{terms.deposit.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 block">Refundable upon vacating</span>
            </div>

            {/* Move-in Date */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" /> Commencement Date
              </span>
              <p className="text-lg font-black text-slate-900">
                {terms.moveInDate}
              </p>
              <span className="text-[10px] text-slate-400 block">Official move-in &amp; handover</span>
            </div>

            {/* Lease Duration */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-600" /> Lease Term
              </span>
              <p className="text-lg font-black text-slate-900">
                {terms.durationMonths} Months
              </p>
              <span className="text-[10px] text-slate-400 block">Residential tenancy</span>
            </div>

            {/* Notice Period */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" /> Notice Period
              </span>
              <p className="text-lg font-black text-slate-900">
                {terms.noticePeriodDays} Days
              </p>
              <span className="text-[10px] text-slate-400 block">Written notice required</span>
            </div>

            {/* Utilities */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Utilities Split
              </span>
              <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                {terms.utilities}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
