import { useState } from "react";
import {
  Sparkles,
  PenTool,
  AlertTriangle,
  Info,
  Trash2,
  HelpCircle,
  Loader2,
  Plus,
} from "lucide-react";
import type {
  CustomClause,
  DraftClauseResponse,
} from "@/types/agreement.types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";
import { agreementService } from "@/services/agreementService";

interface AgreementClausesSectionProps {
  clauses: CustomClause[];
  isEditable: boolean;
  agreementId: string;
  currentUserId: string;
  onAddClause: (clause: CustomClause) => void;
  onRemoveClause: (index: number) => void;
}

const EXAMPLE_PROMPTS = [
  "No smoking or vaping anywhere inside the apartment",
  "Overnight guests permitted on weekends with prior 24h notice",
  "Quiet hours observed from 11:00 PM to 7:00 AM daily",
  "Equal monthly split of high-speed fiber internet and housekeeping fees",
];

export function AgreementClausesSection({
  clauses,
  isEditable,
  agreementId,
  currentUserId,
  onAddClause,
  onRemoveClause,
}: AgreementClausesSectionProps) {
  // Drafting state
  const [userNeed, setUserNeed] = useState("");
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [draftResult, setDraftResult] = useState<DraftClauseResponse | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [editedClauseText, setEditedClauseText] = useState("");

  // Handler: Draft clause with AI
  const handleDraftWithAi = async () => {
    if (!userNeed.trim()) {
      toast.error("Please describe your clause requirement first.");
      return;
    }

    try {
      setIsDraftingAi(true);
      const res = await agreementService.draftClause(agreementId, userNeed.trim());
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

  // Handler: Add confirmed clause to the proposal
  const handleAddClauseToProposal = () => {
    const textToAdd = editedClauseText.trim();
    if (!textToAdd) {
      toast.error("Clause text cannot be empty.");
      return;
    }

    onAddClause({
      proposedBy: currentUserId,
      originalText: userNeed.trim() || textToAdd,
      aiDraftText: draftResult?.clauseText,
      finalText: textToAdd,
      status: "accepted",
      createdAt: new Date().toISOString(),
    });

    // Reset drafting form
    setUserNeed("");
    setDraftResult(null);
    setEditedClauseText("");
    setIsManualMode(false);
    toast.success("Custom clause added to proposal.");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Info Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span>Custom Clauses &amp; House Rules</span>
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Add custom house rules or special covenants (quiet hours, guests, utilities).
              AI drafts a formal, neutral clause from plain text. Both parties must mutually accept before completion.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
              {clauses.length} Covenants
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>AI Drafter Policy:</strong> The AI acts as a drafter only and never auto-inserts clauses. Review the preview carefully before adding to the proposal.
          </span>
        </div>
      </div>

      {/* 2. Draft / Add Clause Form (Only when holding edit lock) */}
      {isEditable && (
        <div className="rounded-3xl border border-indigo-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5 text-indigo-600" />
              <span>Draft a New Custom Clause</span>
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
              disabled={isDraftingAi}
              value={userNeed}
              onChange={(e) => setUserNeed(e.target.value)}
              placeholder="Describe your requirement in simple everyday words (e.g. 'no smoking inside, guests only till 10 PM, vegetarian only cooking')..."
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
                  disabled={isDraftingAi}
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
                disabled={isDraftingAi || !userNeed.trim()}
                onClick={handleDraftWithAi}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
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
                      You may adjust the text below to make it compliant before adding it.
                    </p>
                  </div>
                </div>
              )}

              {/* Notice if conflicts with base terms */}
              {draftResult && draftResult.conflictsWithBaseTerms && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Potential Terms Conflict:</span> This clause might overlap with the agreed base financial terms.
                  </div>
                </div>
              )}

              {/* Editable Textarea for the Final Clause */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Clause Text (Review &amp; Edit):
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
              <div className="rounded-xl bg-white/80 border border-indigo-100 p-2.5 text-[11px] text-slate-500">
                <span>
                  <strong>Disclaimer:</strong> {draftResult?.disclaimer || "AI-drafted clause. Not legal advice. Please review carefully."}
                </span>
              </div>

              {/* Add Button */}
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
                  disabled={!editedClauseText.trim()}
                  onClick={handleAddClauseToProposal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add to Proposal</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Existing Custom Clauses List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Proposed Custom Covenants ({clauses.length})
          </h3>
          {isEditable && (
            <span className="text-[11px] text-indigo-600 font-semibold">
              Editing proposal
            </span>
          )}
        </div>

        {clauses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center space-y-2">
            <HelpCircle className="h-6 w-6 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              No custom clauses added to this proposal yet.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {isEditable
                ? "Use the form above to add customized rules using Gemini AI drafting."
                : "You can click 'Edit Proposal' above to propose new custom clauses."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {clauses.map((clause, index) => (
              <div
                key={clause.id || index}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                    Clause #{index + 1}
                  </span>

                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => onRemoveClause(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Remove clause from proposal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-900 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
                  &ldquo;{clause.finalText}&rdquo;
                </p>

                {clause.originalText && clause.originalText !== clause.finalText && (
                  <p className="text-[11px] text-slate-500 italic pl-1">
                    Requirement: &ldquo;{clause.originalText}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
