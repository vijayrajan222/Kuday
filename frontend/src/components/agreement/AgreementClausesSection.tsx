import { useState } from "react";
import {
  Sparkles,
  PenTool,
  Check,
  X,
  RotateCcw,
  AlertTriangle,
  Info,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import type {
  Agreement,
  CustomClause,
  DraftClauseResponse,
  ProposeCustomClausePayload,
  RespondCustomClausePayload,
} from "@/types/agreement.types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";
import { agreementService } from "@/services/agreementService";

interface AgreementClausesSectionProps {
  agreement: Agreement;
  currentUserId: string;
  isHost: boolean;
  onProposeClause: (payload: ProposeCustomClausePayload) => Promise<void>;
  onRespondClause: (clauseId: string, payload: RespondCustomClausePayload) => Promise<void>;
  updating: boolean;
}

const EXAMPLE_PROMPTS = [
  "No smoking or vaping anywhere inside the apartment",
  "Overnight guests permitted on weekends with prior 24h notice",
  "Quiet hours observed from 11:00 PM to 7:00 AM daily",
  "Equal monthly split of high-speed fiber internet and housekeeping fees",
];

export function AgreementClausesSection({
  agreement,
  currentUserId,
  onProposeClause,
  onRespondClause,
  updating,
}: AgreementClausesSectionProps) {
  const otherParty = currentUserId === agreement.hostId ? agreement.seeker : agreement.host;
  const otherName = otherParty?.firstName || "Counterparty";

  // Drafting state
  const [userNeed, setUserNeed] = useState("");
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [draftResult, setDraftResult] = useState<DraftClauseResponse | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [editedClauseText, setEditedClauseText] = useState("");

  // Counter proposal state (clauseId -> counterText)
  const [counteringClauseId, setCounteringClauseId] = useState<string | null>(null);
  const [counterText, setCounterText] = useState("");

  // Handler: Draft clause with AI
  const handleDraftWithAi = async () => {
    if (!userNeed.trim()) {
      toast.error("Please describe your clause requirement first.");
      return;
    }

    try {
      setIsDraftingAi(true);
      const res = await agreementService.draftClause(agreement.id, userNeed.trim());
      setDraftResult(res);
      setEditedClauseText(res.clauseText || userNeed.trim());
      setIsManualMode(false);

      if (!res.allowed) {
        toast.info(res.reason || "The AI flagged this requirement. You may edit it manually.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
      // Fallback to manual writing if AI service fails
      setIsManualMode(true);
      setEditedClauseText(userNeed.trim());
    } finally {
      setIsDraftingAi(false);
    }
  };

  // Handler: Submit proposed clause
  const handleSendClause = async () => {
    const textToSend = editedClauseText.trim();
    if (!textToSend) {
      toast.error("Clause text cannot be empty.");
      return;
    }

    try {
      await onProposeClause({
        originalText: userNeed.trim() || textToSend,
        aiDraftText: draftResult?.clauseText,
        finalText: textToSend,
      });

      // Reset drafting form
      setUserNeed("");
      setDraftResult(null);
      setEditedClauseText("");
      setIsManualMode(false);
      toast.success(`Clause proposed to ${otherName} for review.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Handler: Accept clause
  const handleAccept = async (clauseId: string) => {
    try {
      await onRespondClause(clauseId, { action: "accept" });
      toast.success("Clause accepted and added to the agreement!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Handler: Reject clause
  const handleReject = async (clauseId: string) => {
    try {
      await onRespondClause(clauseId, { action: "reject" });
      toast.success("Clause declined.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Handler: Submit counter proposal
  const handleSendCounter = async (clauseId: string) => {
    if (!counterText.trim()) {
      toast.error("Please enter your counter-proposed clause text.");
      return;
    }

    try {
      await onRespondClause(clauseId, {
        action: "counter",
        counterText: counterText.trim(),
      });
      setCounteringClauseId(null);
      setCounterText("");
      toast.success(`Counter-proposal sent to ${otherName}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isLocked = agreement.status === "signed" || Boolean(agreement.lockedAt);
  const clauses = agreement.customClauses || [];

  return (
    <div className="space-y-8">
      {/* 1. Header & Info Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span>Custom Clauses &amp; House Rules</span>
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Type any plain-language rule (e.g. guest policies, quiet hours, cooking preferences). Our AI drafter will convert it into a formal, neutral clause. Both parties must mutually agree before a clause enters the final agreement.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
              {clauses.filter((c) => c.status === "accepted").length} Accepted Clauses
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>AI Drafter Policy:</strong> The AI acts as a drafting assistant only and never inserts clauses automatically. Always review the drafted text before proposing it to {otherName}.
          </span>
        </div>
      </div>

      {/* 2. Draft / Propose Clause Section (Hidden if Agreement is Signed/Locked) */}
      {!isLocked && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5 text-slate-600" />
              <span>Propose a New Custom Clause</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {userNeed.length}/500 chars
            </span>
          </div>

          {/* Plain Language Input */}
          <div className="space-y-2">
            <textarea
              rows={3}
              maxLength={500}
              disabled={isDraftingAi || updating}
              value={userNeed}
              onChange={(e) => setUserNeed(e.target.value)}
              placeholder="Describe what you need in simple everyday words (e.g., 'no loud music after 10 PM, vegetarian only cooking in shared kitchen, guests allowed on weekends with advance notice')..."
              className="w-full text-xs rounded-2xl border border-slate-300 p-3.5 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors disabled:bg-slate-50"
            />

            {/* Quick Suggestion Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Suggestions:
              </span>
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isDraftingAi || updating}
                  onClick={() => setUserNeed(prompt)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          {!draftResult && !isManualMode && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsManualMode(true);
                  setEditedClauseText(userNeed.trim());
                }}
                className="text-xs text-slate-500 hover:text-slate-900 underline font-semibold transition-colors cursor-pointer"
              >
                Write manually without AI &rarr;
              </button>

              <Button
                type="button"
                disabled={isDraftingAi || !userNeed.trim() || updating}
                onClick={handleDraftWithAi}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 rounded-xl shadow-xs inline-flex items-center gap-1.5"
              >
                {isDraftingAi ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Drafting with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Draft with AI</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* AI Preview & Editing Box */}
          {(draftResult || isManualMode) && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{isManualMode ? "Manual Clause Formulation" : "AI-Drafted Preview (Review & Edit)"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDraftResult(null);
                    setIsManualMode(false);
                    setEditedClauseText("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Warning if AI flagged disallowed clause */}
              {draftResult && !draftResult.allowed && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Flagged Issue:</span> {draftResult.reason}
                    <p className="text-[11px] text-rose-700 mt-1">
                      You may adjust the text below to make it compliant before proposing it.
                    </p>
                  </div>
                </div>
              )}

              {/* Notice if conflicts with base terms */}
              {draftResult && draftResult.conflictsWithBaseTerms && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Potential Terms Conflict:</span> This clause might overlap with the agreed base financial terms (such as rent or notice period).
                  </div>
                </div>
              )}

              {/* Editable Textarea for the Final Clause */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Final Clause Text (You can edit before sending):
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={editedClauseText}
                  onChange={(e) => setEditedClauseText(e.target.value)}
                  className="w-full text-xs font-medium text-slate-900 bg-white rounded-xl border border-slate-300 p-3 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Legal Disclaimer */}
              <div className="rounded-xl bg-white/80 border border-indigo-100 p-2.5 text-[11px] text-slate-500 flex items-center justify-between">
                <span>
                  <strong>Disclaimer:</strong> {draftResult?.disclaimer || "AI-drafted clause. Not legal advice. Please review carefully."}
                </span>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDraftResult(null);
                    setIsManualMode(false);
                    setEditedClauseText("");
                  }}
                  className="text-xs"
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  disabled={updating || !editedClauseText.trim()}
                  onClick={handleSendClause}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 rounded-xl shadow-xs"
                >
                  {updating ? "Sending..." : `Send to ${otherName} for Review &rarr;`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Existing Custom Clauses List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Agreement Clauses</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {clauses.length}
            </span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Real-time bilateral resolution
          </span>
        </div>

        {clauses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center space-y-2">
            <HelpCircle className="h-6 w-6 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              No custom clauses added yet.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              You and {otherName} can add special covenants like guest permissions, quiet hours, or utility sharing terms above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clauses.map((clause: CustomClause) => {
              const isProposedByMe = clause.proposedBy === currentUserId;
              const isCounteringThis = counteringClauseId === clause.id;

              return (
                <div
                  key={clause.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all bg-white shadow-2xs space-y-3 ${
                    clause.status === "accepted"
                      ? "border-emerald-200"
                      : clause.status === "rejected"
                      ? "border-rose-100 opacity-60"
                      : clause.status === "countered"
                      ? "border-purple-200 bg-purple-50/20"
                      : "border-amber-200 bg-amber-50/20"
                  }`}
                >
                  {/* Top Metadata Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          clause.status === "accepted"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : clause.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : clause.status === "countered"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {clause.status === "accepted" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                        {clause.status === "rejected" && <XCircle className="h-3 w-3 text-rose-500" />}
                        {clause.status === "countered" && <RotateCcw className="h-3 w-3 text-purple-600" />}
                        {clause.status === "proposed" && <Clock className="h-3 w-3 text-amber-600" />}
                        <span>{clause.status}</span>
                      </span>

                      {/* Originator info */}
                      <span className="text-[11px] font-medium text-slate-500">
                        {isProposedByMe ? "Proposed by You" : `Proposed by ${otherName}`}
                      </span>

                      {clause.createdAt && (
                        <span className="text-[10px] text-slate-400">
                          &bull; {new Date(clause.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Inclusion Indicator */}
                    <div className="text-[11px] font-semibold text-slate-500">
                      {clause.status === "accepted" ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-bold">
                          <ShieldCheck className="h-3.5 w-3.5" /> Enters Final Agreement
                        </span>
                      ) : clause.status === "rejected" ? (
                        <span className="text-rose-600">Excluded</span>
                      ) : (
                        <span className="text-amber-700">Pending Bilateral Resolution</span>
                      )}
                    </div>
                  </div>

                  {/* Clause Content */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      &ldquo;{clause.finalText}&rdquo;
                    </p>

                    {clause.originalText && clause.originalText !== clause.finalText && (
                      <p className="text-[11px] text-slate-500 italic pl-1">
                        Initial requirement: &ldquo;{clause.originalText}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions for Pending or Countered Clauses */}
                  {!isLocked && (clause.status === "proposed" || clause.status === "countered") && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* If the current user proposed this clause, they must wait for the other party */}
                      {isProposedByMe ? (
                        <div className="text-xs text-amber-700 flex items-center gap-1.5 italic">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Waiting for {otherName}&apos;s review and response...</span>
                        </div>
                      ) : (
                        /* The counterparty can Accept, Reject, or Counter */
                        <div className="w-full space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              size="sm"
                              disabled={updating}
                              onClick={() => handleAccept(clause.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-4 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Accept Clause</span>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={updating}
                              onClick={() => {
                                setCounteringClauseId(isCounteringThis ? null : clause.id);
                                setCounterText(clause.finalText);
                              }}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-xl px-4 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Counter Propose</span>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={updating}
                              onClick={() => handleReject(clause.id)}
                              className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl px-4 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Decline</span>
                            </Button>
                          </div>

                          {/* Inline Counter Proposal Editor */}
                          {isCounteringThis && (
                            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 space-y-2 animate-in fade-in duration-150">
                              <label className="text-[11px] font-bold text-purple-950 uppercase tracking-wider block">
                                Propose an edited counter-version:
                              </label>
                              <textarea
                                rows={2}
                                maxLength={1000}
                                value={counterText}
                                onChange={(e) => setCounterText(e.target.value)}
                                className="w-full text-xs bg-white rounded-lg border border-purple-300 p-2.5 focus:border-purple-600 focus:outline-none"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCounteringClauseId(null)}
                                  className="text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={updating || !counterText.trim()}
                                  onClick={() => handleSendCounter(clause.id)}
                                  className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 rounded-lg"
                                >
                                  Submit Counter-Proposal
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
