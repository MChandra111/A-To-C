"use client";

import { useState } from "react";
import { buildCoachSystemPrompt } from "@/lib/claude/coachSystemPrompt";
import { cn } from "@/lib/utils";

interface CoachChatProps {
  aspirationTitle: string;
  investmentScore: number;
  gapScore?: number | null;
  currentMilestoneLabel?: string | null;
}

// TODO (V2): connect chat UI — wire to /api/coach/chat with streaming Claude responses

export function CoachChat({
  aspirationTitle,
  investmentScore,
  gapScore = null,
  currentMilestoneLabel = null,
}: CoachChatProps) {
  const [open, setOpen] = useState(false);

  const systemPrompt = buildCoachSystemPrompt({
    aspirationTitle,
    gapScore,
    investmentScore,
    currentMilestoneLabel,
    trendDirection: "flat",
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-40 rounded-full border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary shadow-lg transition-colors hover:border-primary",
          open && "border-primary"
        )}
        aria-expanded={open}
        aria-label="AI coach"
      >
        Coach
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-[min(100vw-2.5rem,22rem)] rounded-xl border border-border bg-surface p-4 shadow-xl">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            AI Coach · V2 scaffold
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Context-aware coaching will connect here. The system prompt is
            ready — chat streaming is not wired yet.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-primary">
              Preview system prompt
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-background p-2 font-mono text-[10px] text-text-muted whitespace-pre-wrap">
              {systemPrompt}
            </pre>
          </details>
        </div>
      )}
    </>
  );
}
