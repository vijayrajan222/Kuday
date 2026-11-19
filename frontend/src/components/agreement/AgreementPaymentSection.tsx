import { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Crown,
  Sparkles,
  Lock,
  ArrowRight,
  AlertTriangle,
  Loader2,
  FileCheck,
} from "lucide-react";
import type { Agreement } from "@/types/agreement.types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";
import { agreementService } from "@/services/agreementService";
import { loadRazorpayScript } from "@/services/paymentService";

interface AgreementPaymentSectionProps {
  agreement: Agreement;
  isHost: boolean;
  onPaymentSuccess: (updated: Agreement) => void;
  onProceedToCompleted?: () => void;
}

export function AgreementPaymentSection({
  agreement,
  isHost,
  onPaymentSuccess,
  onProceedToCompleted,
}: AgreementPaymentSectionProps) {
  const [processing, setProcessing] = useState(false);

  const seeker = agreement.seeker;
  const isSeekerPremium = Boolean(seeker?.isPremium);
  const isPaymentCompleted =
    agreement.payment?.status === "completed" ||
    agreement.payment?.status === "waived" ||
    agreement.status === "completed";

  const hasBlockers = agreement.status === "draft" || agreement.status === "negotiating";

  const handleStartPayment = async () => {
    if (hasBlockers) {
      toast.error(
        "Please resolve all pending terms and custom clauses before initiating payment."
      );
      return;
    }

    try {
      setProcessing(true);
      const orderData = await agreementService.createPaymentOrder(agreement.id);

      // If fee was waived (e.g. premium seeker)
      if (orderData.waived) {
        toast.success(
          orderData.waiverReason || "Agreement fee waived for Kuday Premium member!"
        );
        onPaymentSuccess(orderData.agreement);
        return;
      }

      // Check provider: Mock mode vs Razorpay
      if (orderData.provider === "mock" || !orderData.orderId) {
        toast.info("Processing test transaction via Mock Provider...");
        const mockPaymentId = `mock_pay_${Date.now()}`;
        const updatedAgreement = await agreementService.verifyPayment(agreement.id, {
          orderId: orderData.orderId || `mock_order_${Date.now()}`,
          paymentId: mockPaymentId,
        });

        toast.success("Payment verified successfully via Mock Provider!");
        onPaymentSuccess(updatedAgreement);
        return;
      }

      // Razorpay Provider
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay SDK could not be loaded. Please check your internet connection.");
        return;
      }

      const feeAmount = agreement.payment?.amount || 250;
      const options = {
        key: orderData.keyId || "rzp_test_Ty9tPfhtsUOceK",
        amount: orderData.amount || feeAmount * 100,
        currency: orderData.currency || "INR",
        name: "Kuday Room Rentals",
        description: "Residential Agreement Verification Fee",
        order_id: orderData.orderId,
        prefill: {
          name: `${seeker?.firstName || ""} ${seeker?.lastName || ""}`.trim(),
          email: seeker?.email || "",
        },
        theme: {
          color: "#0f172a",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            toast.info("Verifying transaction with server...");
            const updated = await agreementService.verifyPayment(agreement.id, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            toast.success("Payment verified successfully! Agreement unlocked for signing.");
            onPaymentSuccess(updated);
          } catch (verifyErr) {
            toast.error(`Verification failed: ${getErrorMessage(verifyErr)}`);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      if (!window.Razorpay) {
        toast.error("Razorpay SDK failed to load. Please try again.");
        setProcessing(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (failedRes: { error?: { description?: string } }) => {
        toast.error(failedRes.error?.description || "Payment failed on Razorpay.");
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Unresolved Blockers Alert */}
      {hasBlockers && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Negotiation In Progress</h4>
            <p>
              Both parties must agree on the latest proposal revision before payment can be completed.
            </p>
          </div>
        </div>
      )}

      {/* 2. Fee Status Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Agreement Preparation &amp; Archival Fee
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              A standard digital execution and legal consistency fee applies to tenancy agreements.
            </p>
          </div>

          <div>
            {isPaymentCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{agreement.payment?.status === "waived" ? "Fee Waived (Premium)" : "Payment Verified"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>Awaiting Payment</span>
              </span>
            )}
          </div>
        </div>

        {/* Breakdown & Role View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: What's Included */}
          <div className="space-y-3.5 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              What is included:
            </h3>
            <div className="space-y-2.5 text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Standardized Indian Tenancy Act compliant residential agreement draft</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Gemini AI legal neutrality scan &amp; bilateral custom covenants</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                <span>Digital signing with audit log (timestamp, authenticated userId &amp; IP record)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <FileCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Downloadable locked PDF copy archived securely in your Kuday dashboard</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Action Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Fee Breakdown
            </h3>

            {/* Case A: Seeker is Premium -> 100% Free Waiver */}
            {isSeekerPremium ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-3">
                  <Crown className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs text-emerald-950">
                    <span className="font-black">Kuday Premium Member Exemption</span>
                    <p className="text-[11px] text-emerald-800">
                      The agreement fee is 100% waived for active Kuday Premium members.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200">
                  <span className="text-slate-500">Standard Agreement Fee</span>
                  <span className="line-through text-slate-400">₹{agreement.payment?.amount || 250}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold py-1 border-t border-slate-200">
                  <span className="text-emerald-700">Premium Discount</span>
                  <span className="text-emerald-700">-₹{agreement.payment?.amount || 250}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-black pt-2 border-t border-slate-200">
                  <span>Net Amount Due</span>
                  <span className="text-emerald-700">₹0 (Free)</span>
                </div>

                <Button
                  type="button"
                  disabled={hasBlockers || processing}
                  onClick={handleStartPayment}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  {isPaymentCompleted ? "Proceed to Final Agreement &rarr;" : "Confirm Waiver & Unlock Agreement &rarr;"}
                </Button>
              </div>
            ) : isPaymentCompleted ? (
              /* Case B: Payment Already Completed */
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs text-emerald-950">
                    <span className="font-black">Fee Paid &amp; Verified</span>
                    <p className="text-[11px] text-emerald-800">
                      Payment of ₹{agreement.payment?.amount || 250} has been successfully processed. The agreement is completed and available for download.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={onProceedToCompleted}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <span>View Completed Agreement &amp; PDF</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : isHost ? (
              /* Case C: Host Viewing (Host does not pay, waiting for seeker) */
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sky-950 space-y-1">
                  <span className="font-bold">Host Exemption</span>
                  <p className="text-[11px] text-sky-800">
                    Host accounts are exempt from the agreement preparation fee. The fee of ₹{agreement.payment?.amount || 250} is covered by the tenant prior to downloading the PDF.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Current Status:
                  </span>
                  <p className="font-medium text-slate-800">
                    Awaiting {seeker?.firstName || "tenant"} to complete verification fee.
                  </p>
                </div>
              </div>
            ) : (
              /* Case D: Seeker Viewing (Must pay) */
              <div className="space-y-3 text-xs">
                <div className="space-y-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Agreement Preparation Fee</span>
                    <span>₹{(agreement.payment?.amount || 250).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Digital Archival &amp; PDF</span>
                    <span className="text-emerald-700 font-semibold">Included</span>
                  </div>
                </div>

                <div className="flex items-center justify-between font-black text-sm text-slate-900 pb-1">
                  <span>Total Amount</span>
                  <span>₹{(agreement.payment?.amount || 250).toFixed(2)}</span>
                </div>

                <Button
                  type="button"
                  disabled={hasBlockers || processing}
                  onClick={handleStartPayment}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Initiating Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Pay ₹{agreement.payment?.amount || 250} &amp; Unlock PDF</span>
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-slate-400 text-center">
                  Encrypted test payment gateway &middot; Immediate electronic execution unlock
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
