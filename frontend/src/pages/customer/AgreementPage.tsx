import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  Sparkles,
  CreditCard,
  PenTool,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { agreementService } from "@/services/agreementService";
import type {
  Agreement,
  CommonTerms,
  ProposeCustomClausePayload,
  RespondCustomClausePayload,
} from "@/types/agreement.types";
import { AgreementTermsSection } from "@/components/agreement/AgreementTermsSection";
import { AgreementObligationsSection } from "@/components/agreement/AgreementObligationsSection";
import { AgreementClausesSection } from "@/components/agreement/AgreementClausesSection";
import { AgreementPaymentSection } from "@/components/agreement/AgreementPaymentSection";
import { AgreementSignSection } from "@/components/agreement/AgreementSignSection";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";
import { ROUTES } from "@/constants/routes";

const STEPS = [
  { id: 1, label: "Review Terms", icon: FileText, desc: "Covenants & schedule" },
  { id: 2, label: "Custom Clauses", icon: Sparkles, desc: "AI-assisted clauses" },
  { id: 3, label: "Payment", icon: CreditCard, desc: "Agreement fee verification" },
  { id: 4, label: "Sign & Finalize", icon: PenTool, desc: "Dual party signing" },
];

export default function AgreementPage() {
  const { agreementId } = useParams<{ agreementId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState<"terms" | "obligations">("terms");

  const loadAgreement = useCallback(async () => {
    if (!agreementId) return;
    try {
      const data = await agreementService.getAgreement(agreementId);
      setAgreement(data);
    } catch (err) {
      toast.error(`Failed to load agreement: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [agreementId]);

  useEffect(() => {
    loadAgreement();
  }, [loadAgreement]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket || !agreementId) return;

    socket.emit("join_agreement", agreementId);

    const handleAgreementUpdated = (payload?: { agreementId?: string; id?: string }) => {
      const targetId = payload?.agreementId || payload?.id;
      if (!targetId || targetId === agreementId) {
        loadAgreement();
      }
    };

    const handleAgreementSigned = (payload?: { agreementId?: string; id?: string }) => {
      const targetId = payload?.agreementId || payload?.id;
      if (!targetId || targetId === agreementId) {
        loadAgreement();
        toast.success("The rental agreement has been signed by both parties and sealed!");
      }
    };

    socket.on("agreement_updated", handleAgreementUpdated);
    socket.on("agreement_signed", handleAgreementSigned);

    return () => {
      socket.emit("leave_agreement", agreementId);
      socket.off("agreement_updated", handleAgreementUpdated);
      socket.off("agreement_signed", handleAgreementSigned);
    };
  }, [socket, agreementId, loadAgreement]);

  const isHost = useMemo(() => {
    if (!user?.id || !agreement) return false;
    return agreement.hostId === user.id;
  }, [user?.id, agreement]);

  const handleProposeTerms = async (terms: CommonTerms) => {
    if (!agreement) return;
    try {
      setUpdating(true);
      const updated = await agreementService.proposeCommonTerms(agreement.id, terms);
      setAgreement(updated);
      toast.success("Common term adjustments proposed successfully.");
    } catch (err) {
      toast.error(`Failed to propose terms: ${getErrorMessage(err)}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRespondTerms = async (action: "accept" | "reject") => {
    if (!agreement) return;
    try {
      setUpdating(true);
      const updated = await agreementService.respondCommonTerms(agreement.id, action);
      setAgreement(updated);
      toast.success(
        action === "accept"
          ? "Proposed terms accepted and updated."
          : "Proposed adjustments declined."
      );
    } catch (err) {
      toast.error(`Failed to respond to terms: ${getErrorMessage(err)}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleProposeClause = async (payload: ProposeCustomClausePayload) => {
    if (!agreement) return;
    try {
      setUpdating(true);
      const updated = await agreementService.proposeClause(agreement.id, payload);
      setAgreement(updated);
    } finally {
      setUpdating(false);
    }
  };

  const handleRespondClause = async (
    clauseId: string,
    payload: RespondCustomClausePayload
  ) => {
    if (!agreement) return;
    try {
      setUpdating(true);
      const updated = await agreementService.respondClause(agreement.id, clauseId, payload);
      setAgreement(updated);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-900 border-t-transparent" />
        <p className="text-xs text-slate-500 font-medium">Loading residential agreement...</p>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <FileText className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Rental Agreement Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested agreement either does not exist or you lack authorization to review it.
        </p>
        <Button onClick={() => navigate(ROUTES.MATCHED)} variant="outline" size="sm">
          Return to Matched Roommates
        </Button>
      </div>
    );
  }

  const otherUser = isHost ? agreement.seeker : agreement.host;
  const otherUserName = otherUser?.firstName
    ? `${otherUser.firstName} ${otherUser.lastName || ""}`.trim()
    : isHost
    ? "Roommate"
    : "Host";

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              to={ROUTES.MATCHED}
              className="hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Matched Connections
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Residential Rental Agreement</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Rental Agreement &middot; {agreement.room?.title || agreement.room?.roomType || "Shared Room"}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span>Location: {agreement.room?.location || "Premises Address"}</span>
            <span>&bull;</span>
            <span>Parties: {isHost ? "You (Host)" : otherUserName} &amp; {isHost ? otherUserName : "You (Tenant)"}</span>
          </p>
        </div>

        {/* Agreement Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
              agreement.status === "signed"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : agreement.status === "ready_to_sign"
                ? "bg-purple-50 text-purple-800 border-purple-300 animate-pulse"
                : agreement.status === "awaiting_payment"
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : agreement.status === "negotiating"
                ? "bg-sky-50 text-sky-800 border-sky-300"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{agreement.status.replace(/_/g, " ")}</span>
          </span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STEPS.map((step) => {
          const StepIcon = step.icon;
          const isActive = activeStep === step.id;
          const isDone = activeStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                // In Phase 1, steps 2, 3, 4 show informative previews
                setActiveStep(step.id);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50/50 text-slate-800 hover:bg-emerald-50"
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    isActive ? "text-slate-300" : isDone ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  Step {step.id}
                </span>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <StepIcon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                )}
              </div>
              <p className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-slate-800"}`}>
                {step.label}
              </p>
              <p
                className={`text-[10px] mt-0.5 leading-snug truncate ${
                  isActive ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {step.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Step 1: Base Terms & Obligations (Phase 1 Focus) */}
      {activeStep === 1 && (
        <div className="space-y-6">
          {/* Subtabs: Common Terms vs Obligations */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveSubTab("terms")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === "terms"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              1. Financial &amp; Schedule Terms
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("obligations")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === "obligations"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              2. Mutual Obligations ({isHost ? "Host First" : "Tenant First"})
            </button>
          </div>

          {activeSubTab === "terms" ? (
            <AgreementTermsSection
              agreement={agreement}
              currentUserId={user?.id || ""}
              isHost={isHost}
              onProposeTerms={handleProposeTerms}
              onRespondTerms={handleRespondTerms}
              updating={updating}
            />
          ) : (
            <AgreementObligationsSection agreement={agreement} isHost={isHost} />
          )}

          {/* Stepper Footer Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Review and agree on financial terms before moving to custom clauses.
            </div>
            <Button
              onClick={() => setActiveStep(2)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6"
            >
              Proceed to Custom Clauses &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Custom Clauses (AI-Assisted & Bilateral Review) */}
      {activeStep === 2 && (
        <div className="space-y-6">
          <AgreementClausesSection
            agreement={agreement}
            currentUserId={user?.id || ""}
            isHost={isHost}
            onProposeClause={handleProposeClause}
            onRespondClause={handleRespondClause}
            updating={updating}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStep(1)}
              className="text-xs font-semibold"
            >
              &larr; Back to Terms
            </Button>
            <Button
              onClick={() => setActiveStep(3)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 rounded-xl"
            >
              Proceed to Payment &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment (Agreement Fee Verification) */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <AgreementPaymentSection
            agreement={agreement}
            isHost={isHost}
            onPaymentSuccess={(updated) => {
              setAgreement(updated);
              setActiveStep(4);
            }}
            onProceedToSign={() => setActiveStep(4)}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStep(2)}
              className="text-xs font-semibold"
            >
              &larr; Back to Clauses
            </Button>
            {(agreement.payment?.status === "completed" ||
              agreement.payment?.status === "waived" ||
              agreement.status === "ready_to_sign" ||
              agreement.status === "signed") && (
              <Button
                onClick={() => setActiveStep(4)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 rounded-xl"
              >
                Proceed to Sign &rarr;
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Dual Party Signing & PDF Lock */}
      {activeStep === 4 && (
        <div className="space-y-6">
          <AgreementSignSection
            agreement={agreement}
            isHost={isHost}
            onSigned={(updated) => {
              setAgreement(updated);
            }}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStep(3)}
              className="text-xs font-semibold"
            >
              &larr; Back to Payment
            </Button>
            <div className="text-xs text-slate-400">
              {agreement.status === "signed"
                ? "Document is sealed & locked"
                : "Awaiting final bilateral assent"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
