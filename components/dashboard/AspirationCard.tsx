import Link from "next/link";
import { AspirationCardObjectives } from "@/components/dashboard/AspirationCardObjectives";
import { ScoreTrend } from "@/components/score/ScoreTrend";
import { WeighInButton } from "@/components/dashboard/WeighInButton";
import { WeighInScheduleLabel } from "@/components/dashboard/WeighInScheduleLabel";
import { cn } from "@/lib/utils";
import type { DashboardGoalCard } from "@/lib/dashboard/getDashboardData";
import type { MilestoneDifficulty } from "@/types";

const DIFFICULTY_BADGE: Record<MilestoneDifficulty, string> = {
  Foundation: "bg-success/15 text-success",
  Building: "bg-primary/15 text-primary",
  Advanced: "bg-warning/15 text-warning",
  "Final Push": "bg-decline/15 text-decline",
};

interface AspirationCardProps {
  goal: DashboardGoalCard;
  showWeighIn?: boolean;
}

export function AspirationCard({ goal, showWeighIn = true }: AspirationCardProps) {
  const { aspiration, roadmap, currentMilestone } = goal;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-semibold text-text-primary">
              {aspiration.title}
            </h3>
            {aspiration.category && (
              <span className="rounded-full bg-surface-elevated px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-muted">
                {aspiration.category}
              </span>
            )}
          </div>
          {currentMilestone && (
            <p className="mt-1 font-mono text-xs text-text-muted">
              {currentMilestone.label} · {currentMilestone.title}
              {goal.objectiveProgress && goal.objectiveProgress.total > 0 && (
                <>
                  {" "}
                  · {goal.objectiveProgress.done}/
                  {goal.objectiveProgress.total} objectives
                </>
              )}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Investment Score
          </p>
          <p className="font-display text-3xl font-bold text-text-primary">
            {goal.investmentScore}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg bg-surface-elevated/40">
        <ScoreTrend data={goal.trend14} height={48} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-text-muted">
        {goal.gapScore !== null && (
          <span className="rounded-full bg-surface-elevated px-2.5 py-1">
            Gap {goal.gapScore}
          </span>
        )}
        {goal.daysRemaining > 0 && (
          <span>{goal.daysRemaining} days left</span>
        )}
        {currentMilestone && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide",
              DIFFICULTY_BADGE[currentMilestone.difficulty_tag]
            )}
          >
            {currentMilestone.difficulty_tag}
          </span>
        )}
      </div>

      {showWeighIn && (
        <div className="mt-4">
          <WeighInScheduleLabel
            state={goal.weighInState}
            scheduleMessage={goal.scheduleMessage}
            nextDueLabel={goal.nextDueLabel}
          />
        </div>
      )}

      {showWeighIn && currentMilestone && (
        <AspirationCardObjectives
          roadmapId={roadmap.id}
          milestone={currentMilestone}
          completions={goal.completions}
        />
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {showWeighIn && (
          <WeighInButton
            roadmapId={roadmap.id}
            canWeighIn={goal.canWeighIn}
            overdueDays={goal.weighInOverdueDays}
          />
        )}
        <Link
          href={`/roadmap/${roadmap.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-3 text-sm text-text-muted transition-colors hover:border-primary/40 hover:text-text-primary"
        >
          View roadmap
        </Link>
      </div>
    </article>
  );
}
