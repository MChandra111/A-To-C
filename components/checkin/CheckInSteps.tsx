"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AiNudge } from "@/components/checkin/AiNudge";
import { CoachChat } from "@/components/coach/CoachChat";
import { EffortSelector } from "@/components/checkin/EffortSelector";
import { ScoreReveal } from "@/components/checkin/ScoreReveal";
import { InvestmentScore } from "@/components/score/InvestmentScore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EffortLevel } from "@/lib/utils/investmentScore";
import type { ScorePoint } from "@/lib/utils/scoreTrend";
import type { ActionCompletion } from "@/lib/checkin/milestoneProgress";
import { isActionItemDoneEarly } from "@/lib/checkin/milestoneProgress";
import type { RoadmapMilestone } from "@/types";

interface CheckInResult {
  ai_response: string;
  score_before: number;
  score_after: number;
  delta: number;
  new_streak: number;
  trend14: ScorePoint[];
}

interface CheckInStepsProps {
  roadmapId: string;
  aspirationTitle: string;
  currentScore: number;
  milestoneIndex: number;
  milestone: RoadmapMilestone;
  scheduleMessage?: string;
  completions?: ActionCompletion[];
}

type Step = 1 | 2 | 3 | 4;

export function CheckInSteps({
  roadmapId,
  aspirationTitle,
  currentScore,
  milestoneIndex,
  milestone,
  scheduleMessage,
  completions = [],
}: CheckInStepsProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [efforts, setEfforts] = useState<Record<number, EffortLevel | null>>(
    () =>
      Object.fromEntries(
        milestone.action_items.map((_, index) => {
          if (
            isActionItemDoneEarly(completions, milestoneIndex, index)
          ) {
            return [index, "done" as EffortLevel];
          }
          return [index, null];
        })
      )
  );
  const [journal, setJournal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);

  const allEffortsSelected = milestone.action_items.every(
    (_, index) => efforts[index] != null
  );

  async function handleSubmit() {
    if (!allEffortsSelected) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmap_id: roadmapId,
          milestone_index: milestoneIndex,
          effort_items: milestone.action_items.map((_, index) => ({
            action_item_index: index,
            effort: efforts[index] as EffortLevel,
          })),
          journal_entry: journal.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Check-in failed");
      }

      setResult(data as CheckInResult);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4">
        <Link
          href="/dashboard"
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          ← Dashboard
        </Link>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Step {step} of 4
        </p>
        <div className="w-16" aria-hidden />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10">
        <div className="mb-6 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            {aspirationTitle}
          </p>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {milestone.label}
          </p>
        </div>

        {step === 1 && (
          <div className="flex w-full max-w-md flex-col items-center">
            <InvestmentScore
              score={currentScore}
              label="Current Investment Score"
              size="lg"
            />
            {scheduleMessage && (
              <p className="mt-6 text-center text-sm text-primary">
                {scheduleMessage}
              </p>
            )}
            <p className="mt-4 text-center text-sm text-text-muted">
              What did you actually do this period?
            </p>
            <ul className="mt-6 w-full space-y-3">
              {milestone.action_items.map((item, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary"
                >
                  {item.task}
                </li>
              ))}
            </ul>
            <Button className="mt-10 w-full max-w-md" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-md space-y-6">
            <p className="text-center text-sm text-text-muted">
              Mark your effort honestly — partial credit is real data.
            </p>
            {milestone.action_items.map((item, index) => {
              const finishedEarly = isActionItemDoneEarly(
                completions,
                milestoneIndex,
                index
              );
              return (
                <div key={index} className="space-y-3">
                  <p className="text-sm font-medium text-text-primary">
                    {item.task}
                    {finishedEarly && (
                      <span className="ml-2 font-mono text-xs text-success">
                        · finished early
                      </span>
                    )}
                  </p>
                  <EffortSelector
                    value={efforts[index] ?? null}
                    disabled={finishedEarly}
                    onChange={(effort) =>
                      setEfforts((prev) => ({ ...prev, [index]: effort }))
                    }
                  />
                </div>
              );
            })}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!allEffortsSelected}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <p className="text-sm text-text-muted">
                Optional — one sentence is enough.
              </p>
            </div>
            <Textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="What happened? One sentence is enough."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            {error && (
              <p className="text-center text-sm text-decline">{error}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Recording…" : "See my reading"}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div className="flex w-full max-w-md flex-col items-center space-y-8">
            <ScoreReveal
              scoreBefore={result.score_before}
              scoreAfter={result.score_after}
              trend14={result.trend14}
            />
            <AiNudge message={result.ai_response} />
            <Button
              className={cn("w-full max-w-md")}
              onClick={() => router.push("/dashboard")}
            >
              Back to dashboard
            </Button>
          </div>
        )}
      </div>

      <CoachChat
        aspirationTitle={aspirationTitle}
        investmentScore={currentScore}
        currentMilestoneLabel={milestone.label}
      />
    </div>
  );
}
