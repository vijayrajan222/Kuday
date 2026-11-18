import { Shield, Home, UserCheck } from "lucide-react";
import type { Agreement } from "@/types/agreement.types";

interface AgreementObligationsSectionProps {
  agreement: Agreement;
  isHost: boolean;
}

export function AgreementObligationsSection({
  agreement,
  isHost,
}: AgreementObligationsSectionProps) {
  const hostSection = (
    <div
      className={`rounded-3xl border p-6 space-y-4 transition-all ${
        isHost
          ? "border-indigo-300 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-200"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              isHost ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            <Home className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Host Obligations</span>
              {isHost && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                  Your Direct Obligations
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Covenants governing structural maintenance, entry protocols, and deposit returns.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        {agreement.hostObligations.map((obligation, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 text-xs text-slate-800 shadow-2xs"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] mt-0.5">
              H{idx + 1}
            </span>
            <p className="leading-relaxed">{obligation}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const seekerSection = (
    <div
      className={`rounded-3xl border p-6 space-y-4 transition-all ${
        !isHost
          ? "border-emerald-300 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-200"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              !isHost ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Seeker (Tenant) Obligations</span>
              {!isHost && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Your Direct Obligations
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Covenants governing timely payments, house regulations, care, and peaceful occupancy.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        {agreement.seekerObligations.map((obligation, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 text-xs text-slate-800 shadow-2xs"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] mt-0.5">
              S{idx + 1}
            </span>
            <p className="leading-relaxed">{obligation}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600 flex items-center gap-2.5">
        <Shield className="h-4 w-4 text-indigo-600 shrink-0" />
        <span>
          Both parties execute a single reciprocal agreement. Your role&apos;s primary commitments are prioritized above, but all statutory covenants are binding upon signing.
        </span>
      </div>

      {/* Role-Aware Display Ordering */}
      {isHost ? (
        <>
          {hostSection}
          {seekerSection}
        </>
      ) : (
        <>
          {seekerSection}
          {hostSection}
        </>
      )}
    </div>
  );
}
