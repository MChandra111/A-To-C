import {
  FinishEarlyButton,
  type EarlyFinishFeedback,
} from "@/components/roadmap/FinishEarlyButton";
import { ObjectiveActionItem } from "@/components/roadmap/ObjectiveActionItem";
import { GuruUpsell } from "@/components/plans/GuruUpsell";
import { cn } from "@/lib/utils";
import type { MilestoneDifficulty, RoadmapMilestone } from "@/types";

const DIFFICULTY_STYLES: Record<
  MilestoneDifficulty,
  { border: string; badge: string }
> = {
  Foundation: {
    border: "border-success/40",
    badge: "bg-success/15 text-success",
  },
  Building: {
    border: "border-primary/40",
    badge: "bg-primary/15 text-primary",
  },
  Advanced: {
    border: "border-warning/40",
    badge: "bg-warning/15 text-warning",
  },
  "Final Push": {
    border: "border-decline/40",
    badge: "bg-decline/15 text-decline",
  },
};

interface MilestoneCardProps {
  milestone: RoadmapMilestone;
  roadmapId?: string;
  isCurrent?: boolean;
  isPast?: boolean;
  progress?: { done: number; total: number; remaining: number };
  fullyDone?: boolean;
  itemStates?: { done: boolean }[];
  onEarlyFinishComplete?: (feedback: EarlyFinishFeedback) => void;
  isLocked?: boolean;
  canUseFinishEarly?: boolean;
}

export function MilestoneCard({
  milestone,
  roadmapId,
  isCurrent = false,
  isPast = false,
  progress,
  fullyDone = false,
  itemStates = [],
  onEarlyFinishComplete,
  isLocked = false,
  canUseFinishEarly = true,
}: MilestoneCardProps) {
  const styles = DIFFICULTY_STYLES[milestone.difficulty_tag];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border bg-surface p-5",
        styles.border,
        isCurrent && !isLocked && "ring-1 ring-primary/50",
        isPast && !isLocked && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-text-muted">{milestone.label}</p>
          <h3 className="mt-1 text-lg font-semibold text-text-primary">
            {milestone.title}
          </h3>
          {isCurrent && progress && progress.total > 0 && (
            <p className="mt-1 font-mono text-xs text-text-muted">
              {progress.done}/{progress.total} objectives
              {fullyDone ? " · complete" : ""}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isCurrent && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary">
              Current
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide",
              styles.badge
            )}
          >
            {milestone.difficulty_tag}
          </span>
        </div>
      </div>

      <div className={cn(isLocked && "select-none blur-sm")}>
      <p className="mt-3 text-sm text-text-muted">{milestone.description}</p>

      {milestone.focus_areas.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {milestone.focus_areas.map((area) => (
            <span
              key={area}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-text-muted"
            >
              {area}
            </span>
          ))}
        </div>
      )}

      <ul className="mt-5 space-y-4 border-t border-border pt-5">
        {milestone.action_items.map((item, index) => {
          const done = itemStates[index]?.done ?? false;

          return (
            <ObjectiveActionItem
              key={index}
              item={item}
              done={done}
              actions={
                isCurrent && roadmapId && !done && !isLocked ? (
                  <FinishEarlyButton
                    roadmapId={roadmapId}
                    milestoneIndex={milestone.index}
                    actionItemIndex={index}
                    taskLabel={item.task}
                    canUse={canUseFinishEarly}
                    onComplete={onEarlyFinishComplete}
                  />
                ) : undefined
              }
            />
          );
        })}
      </ul>
      </div>

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/80 p-4 backdrop-blur-[2px]">
          <GuruUpsell
            compact
            title="Guru unlocks this interval"
            description="Upgrade to reveal personalized objectives and resources for the rest of your roadmap."
            className="max-w-sm border-0 bg-transparent p-0"
          />
        </div>
      )}
    </article>
  );
}
