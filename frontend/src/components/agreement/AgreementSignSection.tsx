import { useState } from "react";
import {
  PenTool,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  Loader2,
  FileText,
  Lock,
} from "lucide-react";
import type { Agreement } from "@/types/agreement.types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";
import { agreementService } from "@/services/agreementService";

interface AgreementSignSectionProps {
  agreement: Agreement;
  isHost: boolean;
  onSigned: (updated: Agreement) => void;
}

export function AgreementSignSection({
  agreement,
  isHost,
  onSigned,
}: AgreementSignSectionProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const host = agreement.host;
  const seeker = agreement.seeker;
  const hostName = `${host?.firstName || ""} ${host?.lastName || ""}`.trim() || "Host";
  const seekerName = `${seeker?.firstName || ""} ${seeker?.lastName || ""}`.trim() || "Tenant";
  const otherName = isHost ? seekerName : hostName;

  const hostSig = agreement.signatures?.host;
  const seekerSig = agreement.signatures?.seeker;

  const hasMySignature = isHost ? Boolean(hostSig?.signedAt) : Boolean(seekerSig?.signedAt);
  const isFullySigned = Boolean(hostSig?.signedAt && seekerSig?.signedAt);

  const acceptedClauses = (agreement.customClauses || []).filter((c) => c.status === "accepted");

  // Handler: Sign agreement
  const handleSign = async () => {
    if (!agreedToTerms) {
      toast.error("Please confirm your assent by checking the agreement box first.");
      return;
    }

    try {
      setSigning(true);
      const updated = await agreementService.signAgreement(agreement.id);
      toast.success(
        updated.status === "signed"
          ? "Agreement fully signed by both parties and sealed!"
          : "Your signature has been securely recorded."
      );
      onSigned(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSigning(false);
    }
  };

  // Handler: Download PDF
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await agreementService.getPdfBlob(agreement.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Kuday_Agreement_${agreement.id.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded successfully.");
    } catch (err) {
      toast.error(`Failed to download PDF: ${getErrorMessage(err)}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Fully Executed Banner */}
      {isFullySigned ? (
        <div className="rounded-3xl border border-emerald-300 bg-emerald-50/80 p-6 sm:p-8 text-emerald-950 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-black text-emerald-950 tracking-tight">
                  Agreement Fully Executed &amp; Sealed
                </h2>
              </div>
              <p className="text-xs text-emerald-800">
                Both you and {otherName} have electronically signed this residential rental contract. All covenants are locked.
              </p>
            </div>

            <Button
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Signed PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ) : hasMySignature ? (
        /* Current User Signed, Waiting for Peer */
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Your Electronic Signature is Recorded</h4>
            <p>
              You have signed the agreement. We are awaiting {otherName} to review and provide their final electronic signature. Once completed, the document will automatically seal and generate a downloadable PDF.
            </p>
          </div>
        </div>
      ) : null}

      {/* 2. Document Summary Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-700" />
              <h3 className="text-base font-black text-slate-900">
                Tenancy Agreement Summary
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Ref: KUDAY-AGR-{agreement.id.slice(-8).toUpperCase()} &middot; Version {agreement.version || 1}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {agreement.lockedAt ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-900 text-white">
                <Lock className="h-3 w-3" /> Sealed &amp; Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                <PenTool className="h-3 w-3" /> Ready for Signing
              </span>
            )}
          </div>
        </div>

        {/* Premises & Parties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Premises Details
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {agreement.room?.title || agreement.room?.roomType || "Residential Room"}
            </p>
            <p className="text-slate-600">{agreement.room?.location || "Premises Address"}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Agreed Financial Schedule
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Monthly Rent</span>
                <span className="font-bold text-slate-900">₹{agreement.commonTerms.rent.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Security Deposit</span>
                <span className="font-bold text-slate-900">₹{agreement.commonTerms.deposit.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Move-in Date</span>
                <span className="font-semibold">{agreement.commonTerms.moveInDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Notice Period</span>
                <span className="font-semibold">{agreement.commonTerms.noticePeriodDays} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Clauses Included */}
        {acceptedClauses.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Agreed Custom Covenants ({acceptedClauses.length})
            </h4>
            <div className="space-y-2">
              {acceptedClauses.map((c, idx) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 flex items-start gap-2"
                >
                  <span className="text-slate-400 font-bold shrink-0">{idx + 1}.</span>
                  <span className="font-medium">&ldquo;{c.finalText}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Dual Signature Execution Status Cards */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Execution Audit Log
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Host Box */}
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1.5 transition-colors ${
                hostSig?.signedAt
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Host (Lessor)</span>
                {hostSig?.signedAt ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Signed
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-slate-700 font-medium">{hostName}</p>
              {hostSig?.signedAt ? (
                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                  <p>Timestamp: {new Date(hostSig.signedAt).toLocaleString()}</p>
                  <p>Audit IP: {hostSig.ip || "Recorded"}</p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Awaiting Host electronic assent
                </p>
              )}
            </div>

            {/* Seeker Box */}
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1.5 transition-colors ${
                seekerSig?.signedAt
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Tenant (Lessee)</span>
                {seekerSig?.signedAt ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Signed
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-slate-700 font-medium">{seekerName}</p>
              {seekerSig?.signedAt ? (
                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                  <p>Timestamp: {new Date(seekerSig.signedAt).toLocaleString()}</p>
                  <p>Audit IP: {seekerSig.ip || "Recorded"}</p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Awaiting Tenant electronic assent
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 4. Action Area for Current User */}
        {!hasMySignature && !isFullySigned && (
          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5 space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <input
                id="sign-assent-checkbox"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <label
                htmlFor="sign-assent-checkbox"
                className="text-xs text-slate-700 leading-relaxed cursor-pointer"
              >
                I, <strong>{isHost ? hostName : seekerName}</strong>, have thoroughly read and hereby agree to all common financial covenants, mutual obligations, and agreed custom clauses contained in this Residential Rental Agreement.
              </label>
            </div>

            <Button
              type="button"
              disabled={!agreedToTerms || signing}
              onClick={handleSign}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Recording Electronic Assent...</span>
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4" />
                  <span>I Agree &amp; Electronically Sign Agreement</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Legal Disclaimer Footer */}
        <p className="text-[11px] text-slate-400 text-center italic border-t border-slate-100 pt-4">
          Disclaimer: This agreement is a record between the two parties and is not a registered or stamped legal document unless executed on stamp paper as required by law.
        </p>
      </div>
    </div>
  );
}
