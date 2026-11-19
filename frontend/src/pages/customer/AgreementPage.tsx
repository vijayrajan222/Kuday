import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CreditCard,
  Download,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Edit3,
  Send,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { agreementService } from "@/services/agreementService";
import type {
  Agreement,
  CommonTerms,
  CustomClause,
} from "@/types/agreement.types";
import { AgreementTermsSection } from "@/components/agreement/AgreementTermsSection";
import { AgreementObligationsSection } from "@/components/agreement/AgreementObligationsSection";
import { AgreementClausesSection } from "@/components/agreement/AgreementClausesSection";
import { AgreementPaymentSection } from "@/components/agreement/AgreementPaymentSection";
import { AgreementDownloadSection } from "@/components/agreement/AgreementDownloadSection";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";
import { ROUTES } from "@/constants/routes";

const STEPS = [
  { id: 1, label: "Review & Edit", icon: FileText, desc: "Common terms & clauses" },
  { id: 2, label: "Await Response", icon: Clock, desc: "Bilateral review & accept" },
  { id: 3, label: "Payment", icon: CreditCard, desc: "Verification fee (if required)" },
  { id: 4, label: "Download PDF", icon: Download, desc: "Final executed agreement" },
];

export default function AgreementPage() {
  const { agreementId } = useParams<{ agreementId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState<"terms" | "clauses" | "obligations">("terms");

  // Local editable draft state when user is editing
  const [draftTerms, setDraftTerms] = useState<CommonTerms | null>(null);
  const [draftClauses, setDraftClauses] = useState<CustomClause[]>([]);

  // Ref to track if current user holds lock for cleanup on unmount
  const isLockHolderRef = useRef(false);

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

  // Determine initial step based on status
  useEffect(() => {
    if (!agreement) return;

    if (agreement.status === "completed") {
      setActiveStep(4);
    } else if (agreement.status === "awaiting_payment") {
      setActiveStep(3);
    } else if (
      agreement.status === "negotiating" &&
      agreement.pendingWith &&
      agreement.pendingWith !== user?.id
    ) {
      setActiveStep(2);
    } else {
      setActiveStep(1);
    }
  }, [agreement?.status, agreement?.pendingWith, user?.id]);

  // Socket real-time synchronization
  useEffect(() => {
    if (!socket || !agreementId) return;

    socket.emit("join_agreement", agreementId);

    const handleReload = (payload?: { agreementId?: string; id?: string }) => {
      const targetId = payload?.agreementId || payload?.id;
      if (!targetId || targetId === agreementId) {
        loadAgreement();
      }
    };

    const handleLockUpdated = (payload?: { agreementId?: string; editLock?: Agreement["editLock"] }) => {
      if (!payload?.agreementId || payload.agreementId === agreementId) {
        if (payload?.editLock) {
          const lock = payload.editLock;
          setAgreement((prev) => (prev ? { ...prev, editLock: lock } : prev));
        } else {
          loadAgreement();
        }
      }
    };

    const handleFinalized = (payload?: { agreementId?: string; id?: string }) => {
      const targetId = payload?.agreementId || payload?.id;
      if (!targetId || targetId === agreementId) {
        loadAgreement();
        toast.success("The rental agreement has been mutually accepted and finalized!");
      }
    };

    socket.on("agreement_updated", handleReload);
    socket.on("agreement_lock_updated", handleLockUpdated);
    socket.on("agreement_finalized", handleFinalized);
    socket.on("agreement_paid", handleReload);
    socket.on("agreement_cancelled", handleReload);

    return () => {
      socket.emit("leave_agreement", agreementId);
      socket.off("agreement_updated", handleReload);
      socket.off("agreement_lock_updated", handleLockUpdated);
      socket.off("agreement_finalized", handleFinalized);
      socket.off("agreement_paid", handleReload);
      socket.off("agreement_cancelled", handleReload);
    };
  }, [socket, agreementId, loadAgreement]);

  // Check lock statuses
  const isHost = useMemo(() => {
    if (!user?.id || !agreement) return false;
    return agreement.hostId === user.id;
  }, [user?.id, agreement]);

  const otherUser = isHost ? agreement?.seeker : agreement?.host;
  const otherUserName = otherUser?.firstName
    ? `${otherUser.firstName} ${otherUser.lastName || ""}`.trim()
    : isHost
    ? "Roommate"
    : "Host";

  const isLockActive = useMemo(() => {
    if (!agreement?.editLock?.userId || !agreement.editLock.expiresAt) return false;
    return new Date(agreement.editLock.expiresAt).getTime() > Date.now();
  }, [agreement?.editLock]);

  const isLockHolder = useMemo(() => {
    return Boolean(isLockActive && agreement?.editLock?.userId === user?.id);
  }, [isLockActive, agreement?.editLock?.userId, user?.id]);

  const isOtherEditing = useMemo(() => {
    return Boolean(isLockActive && agreement?.editLock?.userId !== user?.id);
  }, [isLockActive, agreement?.editLock?.userId, user?.id]);

  // Update ref for cleanup
  useEffect(() => {
    isLockHolderRef.current = isLockHolder;
  }, [isLockHolder]);

  // Sync draft data whenever user enters editing mode
  useEffect(() => {
    if (isLockHolder && agreement) {
      setDraftTerms(agreement.commonTerms);
      setDraftClauses(agreement.customClauses || []);
    } else if (!isLockHolder) {
      setDraftTerms(null);
      setDraftClauses([]);
    }
  }, [isLockHolder, agreement?.commonTerms, agreement?.customClauses]);

  // Heartbeat renewal timer every 2 minutes while user holds lock
  useEffect(() => {
    if (!isLockHolder || !agreementId) return;

    const interval = setInterval(async () => {
      try {
        await agreementService.renewLockHeartbeat(agreementId);
      } catch {
        // Silent fail or let next interaction handle
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [isLockHolder, agreementId]);

  // Release lock on unmount if holding lock
  useEffect(() => {
    return () => {
      if (isLockHolderRef.current && agreementId) {
        agreementService.releaseLock(agreementId).catch(() => {});
      }
    };
  }, [agreementId]);

  // Handler: Acquire Lock
  const handleAcquireLock = async () => {
    if (!agreement) return;
    try {
      setActionLoading(true);
      const updated = await agreementService.acquireLock(agreement.id);
      setAgreement(updated);
      setDraftTerms(updated.commonTerms);
      setDraftClauses(updated.customClauses || []);
      toast.success("Editing lock acquired. You have 10 minutes to make and submit changes.");
    } catch (err) {
      toast.error(`Unable to edit: ${getErrorMessage(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Release Lock / Cancel
  const handleReleaseLock = async () => {
    if (!agreement) return;
    try {
      setActionLoading(true);
      const updated = await agreementService.releaseLock(agreement.id);
      setAgreement(updated);
      setDraftTerms(null);
      setDraftClauses([]);
      toast.info("Editing cancelled and lock released.");
    } catch (err) {
      toast.error(`Failed to release lock: ${getErrorMessage(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Submit Proposal
  const handleSubmitProposal = async () => {
    if (!agreement || !draftTerms) return;
    try {
      setActionLoading(true);
      const updated = await agreementService.submitProposal(agreement.id, {
        revision: agreement.revision,
        commonTerms: draftTerms,
        customClauses: draftClauses,
      });
      setAgreement(updated);
      setDraftTerms(null);
      setDraftClauses([]);
      setActiveStep(2);
      toast.success("Proposal submitted for review! Waiting for other party's response.");
    } catch (err) {
      toast.error(`Submission failed: ${getErrorMessage(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Accept Proposal
  const handleAcceptProposal = async () => {
    if (!agreement) return;
    try {
      setActionLoading(true);
      const updated = await agreementService.acceptProposal(agreement.id, {
        revision: agreement.revision,
      });
      setAgreement(updated);
      if (updated.status === "awaiting_payment") {
        setActiveStep(3);
        toast.success("Proposal accepted! Proceeding to agreement fee verification.");
      } else {
        setActiveStep(4);
        toast.success("Proposal accepted and agreement finalized!");
      }
    } catch (err) {
      toast.error(`Failed to accept proposal: ${getErrorMessage(err)}`);
    } finally {
      setActionLoading(false);
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

  const isPendingMyReview =
    agreement.pendingWith === user?.id && !isLockActive && agreement.status === "negotiating";
  const isWaitingForOther =
    agreement.pendingWith && agreement.pendingWith !== user?.id && agreement.status === "negotiating";
  const isFinalized = agreement.status === "completed";
  const isAwaitingPayment = agreement.status === "awaiting_payment";

  const effectiveTerms = isLockHolder && draftTerms ? draftTerms : agreement.commonTerms;
  const effectiveClauses = isLockHolder ? draftClauses : agreement.customClauses || [];

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
            <span>Revision #{agreement.revision}</span>
            <span>&bull;</span>
            <span>
              Parties: {isHost ? "You (Host)" : otherUserName} &amp;{" "}
              {isHost ? otherUserName : "You (Tenant)"}
            </span>
          </p>
        </div>

        {/* Agreement Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
              isFinalized
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : isAwaitingPayment
                ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                : agreement.status === "ended"
                ? "bg-slate-200 text-slate-700 border-slate-300"
                : agreement.status === "cancelled"
                ? "bg-rose-50 text-rose-700 border-rose-300"
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
          const isDone =
            (step.id === 1 && (agreement.status === "negotiating" || isAwaitingPayment || isFinalized)) ||
            (step.id === 2 && (isAwaitingPayment || isFinalized)) ||
            (step.id === 3 && isFinalized);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
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
              <p
                className={`text-xs font-bold leading-tight ${
                  isActive ? "text-white" : "text-slate-800"
                }`}
              >
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

      {/* STATE BANNERS */}
      {/* 1. User holds editing lock */}
      {isLockHolder && !isFinalized && !isAwaitingPayment && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <Edit3 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                You are currently editing (Revision #{agreement.revision})
              </h4>
              <p className="text-xs text-indigo-800">
                You have exclusive editing lock. Adjust common terms or custom clauses below.
                Submit when ready for {otherUserName} to review.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={handleReleaseLock}
              className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              <XCircle className="h-3.5 w-3.5 mr-1 text-slate-500" /> Cancel Editing
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionLoading}
              onClick={handleSubmitProposal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Submit for Review
            </Button>
          </div>
        </div>
      )}

      {/* 2. Other party holds editing lock */}
      {isOtherEditing && !isFinalized && !isAwaitingPayment && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 shadow-xs">
          <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              {otherUserName} is currently editing (read-only)
            </h4>
            <p className="text-xs text-amber-800">
              Only one party can edit at a time to prevent collisions. You will receive updates live once {otherUserName} submits their proposal.
            </p>
          </div>
        </div>
      )}

      {/* 3. Proposal pending current user's review */}
      {isPendingMyReview && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Review Proposal from {otherUserName} (Revision #{agreement.revision})
              </h4>
              <p className="text-xs text-emerald-800">
                {otherUserName} submitted the latest terms and clauses. You can accept this revision to finalize the agreement, or edit and counter-propose.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={handleAcquireLock}
              className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1 text-slate-500" /> Edit &amp; Counter
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionLoading}
              onClick={handleAcceptProposal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept All
            </Button>
          </div>
        </div>
      )}

      {/* 4. Waiting for other party */}
      {isWaitingForOther && !isLockActive && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 flex items-start gap-3 shadow-xs">
          <Clock className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider">
              Waiting for {otherUserName}
            </h4>
            <p className="text-xs text-sky-800">
              You submitted Revision #{agreement.revision}. Waiting for {otherUserName} to accept or make counter-proposals. View is currently read-only.
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: REVIEW & EDIT */}
      {activeStep === 1 && (
        <div className="space-y-6">
          {/* Subtabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
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
                onClick={() => setActiveSubTab("clauses")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === "clauses"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                2. Custom Clauses ({effectiveClauses.length})
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
                3. Mutual Obligations
              </button>
            </div>

            {/* Edit Lock Button when idle */}
            {!isLockActive && !isFinalized && !isAwaitingPayment && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={actionLoading}
                onClick={handleAcquireLock}
                className="text-xs font-bold border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Agreement
              </Button>
            )}
          </div>

          {/* Subtab Contents */}
          {activeSubTab === "terms" && (
            <AgreementTermsSection
              terms={effectiveTerms}
              isEditable={isLockHolder}
              onChange={(updatedTerms) => setDraftTerms(updatedTerms)}
            />
          )}

          {activeSubTab === "clauses" && (
            <AgreementClausesSection
              clauses={effectiveClauses}
              isEditable={isLockHolder}
              agreementId={agreement.id}
              currentUserId={user?.id || ""}
              onAddClause={(newClause) => setDraftClauses((prev) => [...prev, newClause])}
              onRemoveClause={(index) =>
                setDraftClauses((prev) => prev.filter((_, i) => i !== index))
              }
            />
          )}

          {activeSubTab === "obligations" && (
            <AgreementObligationsSection agreement={agreement} isHost={isHost} />
          )}

          {/* Stepper Footer Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              {isLockHolder
                ? "Remember to submit your proposal when done."
                : isPendingMyReview
                ? "You can accept or edit this proposal."
                : "Review terms and clauses before advancing."}
            </div>
            <div className="flex items-center gap-2">
              {isPendingMyReview && (
                <Button
                  onClick={handleAcceptProposal}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept All
                </Button>
              )}
              {isLockHolder ? (
                <Button
                  onClick={handleSubmitProposal}
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6"
                >
                  Submit for Review &rarr;
                </Button>
              ) : (
                <Button
                  onClick={() => setActiveStep(2)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6"
                >
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: AWAIT RESPONSE */}
      {activeStep === 2 && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <span>Bilateral Review &amp; Proposal Assent</span>
              </h3>
              <p className="text-xs text-slate-500">
                Both host and tenant must align on terms and clauses before the agreement can be executed.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Current Revision
                  </span>
                  <span className="font-semibold text-slate-900">Revision #{agreement.revision}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Last Submitted By
                  </span>
                  <span className="font-semibold text-slate-900">
                    {agreement.lastSubmittedBy === user?.id
                      ? "You"
                      : otherUserName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pending Review With
                  </span>
                  <span className="font-semibold text-slate-900">
                    {agreement.pendingWith === user?.id
                      ? "You (Action required)"
                      : otherUserName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Accepted By
                  </span>
                  <span className="font-semibold text-slate-900">
                    {agreement.acceptedBy?.length
                      ? `${agreement.acceptedBy.length} of 2 parties`
                      : "0 of 2 parties"}
                  </span>
                </div>
              </div>
            </div>

            {isPendingMyReview ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                <p className="text-xs text-emerald-900 font-medium">
                  {otherUserName} submitted this revision. If you agree with all terms and clauses, accept to finalize.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleAcquireLock}
                    className="text-xs font-semibold"
                  >
                    Edit &amp; Counter
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleAcceptProposal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Accept All &rarr;
                  </Button>
                </div>
              </div>
            ) : isWaitingForOther ? (
              <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50 text-xs text-sky-900">
                Waiting for {otherUserName} to review and respond to Revision #{agreement.revision}. You will be notified live when they respond.
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStep(1)}
              className="text-xs font-semibold"
            >
              &larr; Review Terms
            </Button>
            {(isAwaitingPayment || isFinalized) && (
              <Button
                onClick={() => setActiveStep(isAwaitingPayment ? 3 : 4)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6"
              >
                Proceed &rarr;
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <AgreementPaymentSection
            agreement={agreement}
            isHost={isHost}
            onPaymentSuccess={(updated) => {
              setAgreement(updated);
              setActiveStep(4);
            }}
            onProceedToCompleted={() => setActiveStep(4)}
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
            {isFinalized && (
              <Button
                onClick={() => setActiveStep(4)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 rounded-xl"
              >
                Proceed to PDF &rarr;
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: DOWNLOAD PDF */}
      {activeStep === 4 && (
        <div className="space-y-6">
          <AgreementDownloadSection agreement={agreement} />

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStep(1)}
              className="text-xs font-semibold"
            >
              &larr; Inspect Terms
            </Button>
            <div className="text-xs text-slate-400">
              {isFinalized
                ? "Document is sealed & locked"
                : "Agreement execution pending"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
