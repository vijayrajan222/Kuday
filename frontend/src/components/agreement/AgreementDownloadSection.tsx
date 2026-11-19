import { useState } from "react";
import { Download, CheckCircle2, ShieldCheck, FileText, Loader2 } from "lucide-react";
import type { Agreement } from "@/types/agreement.types";
import { agreementService } from "@/services/agreementService";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";

interface AgreementDownloadSectionProps {
  agreement: Agreement;
}

export function AgreementDownloadSection({ agreement }: AgreementDownloadSectionProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await agreementService.getPdfBlob(agreement.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Kuday_Agreement_Rev${agreement.revision || 1}_${agreement.id.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Rental agreement PDF downloaded successfully.");
    } catch (err) {
      toast.error(`Failed to download agreement PDF: ${getErrorMessage(err)}`);
    } finally {
      setDownloading(false);
    }
  };

  const hostName =
    `${agreement.host?.firstName || ""} ${agreement.host?.lastName || ""}`.trim() ||
    "Host";
  const seekerName =
    `${agreement.seeker?.firstName || ""} ${agreement.seeker?.lastName || ""}`.trim() ||
    "Tenant";

  return (
    <div className="space-y-6">
      {/* Execution Success Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 sm:p-8 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
            Agreement Finalized &amp; Locked
          </h2>
          <p className="text-xs sm:text-sm text-emerald-800 max-w-lg mx-auto">
            Both parties have formally reviewed and accepted the terms of this residential tenancy agreement.
            No further modifications may be made to this finalized document.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            size="lg"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow cursor-pointer inline-flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Sealed Agreement (PDF)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Acceptance Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Host Acceptance</span>
          </div>
          <p className="text-sm font-black text-slate-900">{hostName}</p>
          <p className="text-xs text-slate-500">
            Accepted:{" "}
            {agreement.acceptanceTimestamps?.host
              ? new Date(agreement.acceptanceTimestamps.host).toLocaleString("en-IN")
              : agreement.lockedAt
              ? new Date(agreement.lockedAt).toLocaleString("en-IN")
              : "Confirmed"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Tenant Acceptance</span>
          </div>
          <p className="text-sm font-black text-slate-900">{seekerName}</p>
          <p className="text-xs text-slate-500">
            Accepted:{" "}
            {agreement.acceptanceTimestamps?.seeker
              ? new Date(agreement.acceptanceTimestamps.seeker).toLocaleString("en-IN")
              : agreement.lockedAt
              ? new Date(agreement.lockedAt).toLocaleString("en-IN")
              : "Confirmed"}
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          <span>Execution Details</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Monthly Rent</span>
            <span className="font-bold text-slate-800">
              ₹{agreement.commonTerms.rent.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Deposit</span>
            <span className="font-bold text-slate-800">
              ₹{agreement.commonTerms.deposit.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Move-in Date</span>
            <span className="font-bold text-slate-800">{agreement.commonTerms.moveInDate}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Final Revision</span>
            <span className="font-bold text-slate-800">Rev #{agreement.revision || 1}</span>
          </div>
        </div>
      </div>

      {/* Legal Footer Disclaimer */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
        <p className="text-[11px] text-slate-500 italic">
          Disclaimer: This agreement is a record between the two parties and is not a registered or stamped legal document unless executed on stamp paper as required by law.
        </p>
      </div>
    </div>
  );
}
