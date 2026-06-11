import type { EffortLevel } from "@/lib/utils/investmentScore";
import type { RoadmapMilestone } from "@/types";

export interface ActionCompletion {
  milestone_index: number;
  action_item_index: number;
  effort: EffortLevel;
}

const EFFORT_RANK: Record<EffortLevel, number> = {
  done: 3,
  partial: 2,
  skipped: 1,
};

export function getBestEffortForItem(
  completions: ActionCompletion[],
  milestoneIndex: number,
  actionItemIndex: number
): EffortLevel | null {
  const matches = completions.filter(
    (c) =>
      c.milestone_index === milestoneIndex &&
      c.action_item_index === actionItemIndex
  );
  if (matches.length === 0) return null;

  return matches.reduce<EffortLevel>((best, c) => {
    return EFFORT_RANK[c.effort] > EFFORT_RANK[best] ? c.effort : best;
  }, matches[0]!.effort);
}

export function isActionItemDoneEarly(
  completions: ActionCompletion[],
  milestoneIndex: number,
  actionItemIndex: number
): boolean {
  return (
    getBestEffortForItem(completions, milestoneIndex, actionItemIndex) ===
    "done"
  );
}

export function isMilestoneFullyDone(
  milestone: RoadmapMilestone,
  completions: ActionCompletion[]
): boolean {
  return milestone.action_items.every((_, idx) =>
    isActionItemDoneEarly(completions, milestone.index, idx)
  );
}

export function getMilestoneObjectiveProgress(
  milestone: RoadmapMilestone,
  completions: ActionCompletion[]
): { done: number; total: number; remaining: number } {
  const total = milestone.action_items.length;
  const done = milestone.action_items.filter((_, idx) =>
    isActionItemDoneEarly(completions, milestone.index, idx)
  ).length;
  return { done, total, remaining: total - done };
}

/**
 * Which milestone the user should work on — advances only when every
 * objective in the current period is marked done (including early finish).
 */
/** Last consecutive fully-completed milestone index from the start, or -1 if none. */
export function getLastFullyCompletedMilestoneIndex(
  milestones: RoadmapMilestone[] | null,
  completions: ActionCompletion[]
): number {
  if (!milestones || milestones.length === 0) return -1;

  const sorted = [...milestones].sort((a, b) => a.index - b.index);
  let lastCompleted = -1;

  for (const milestone of sorted) {
    if (isMilestoneFullyDone(milestone, completions)) {
      lastCompleted = milestone.index;
    } else {
      break;
    }
  }

  return lastCompleted;
}

export function resolveCurrentMilestoneIndex(
  milestones: RoadmapMilestone[] | null,
  completions: ActionCompletion[]
): number {
  if (!milestones || milestones.length === 0) return 0;

  const sorted = [...milestones].sort((a, b) => a.index - b.index);
  let slot = 0;

  for (const milestone of sorted) {
    if (isMilestoneFullyDone(milestone, completions)) {
      slot++;
    } else {
      break;
    }
  }

  return sorted[Math.min(slot, sorted.length - 1)]!.index;
}

export function getMilestoneByIndex(
  milestones: RoadmapMilestone[] | null,
  index: number
): RoadmapMilestone | null {
  if (!milestones) return null;
  return milestones.find((m) => m.index === index) ?? milestones[0] ?? null;
}

export function getNextMilestone(
  milestones: RoadmapMilestone[] | null,
  currentIndex: number
): RoadmapMilestone | null {
  if (!milestones) return null;
  const sorted = [...milestones].sort((a, b) => a.index - b.index);
  const pos = sorted.findIndex((m) => m.index === currentIndex);
  if (pos < 0 || pos >= sorted.length - 1) return null;
  return sorted[pos + 1] ?? null;
}

export function buildEarlyFinishMessage(
  milestone: RoadmapMilestone,
  progress: { done: number; total: number; remaining: number },
  nextMilestone: RoadmapMilestone | null
): { type: "item" | "milestone"; message: string } {
  if (progress.remaining > 0) {
    const objWord = progress.remaining === 1 ? "objective" : "objectives";
    return {
      type: "item",
      message: `One objective down for ${milestone.label}. ${progress.remaining} ${objWord} left this period — keep going.`,
    };
  }

  const nextLabel = nextMilestone?.label ?? "your next period";
  return {
    type: "milestone",
    message: `${milestone.label} is complete. You're moving on to ${nextLabel}. Your scheduled weigh-in hasn't changed — the scale opens when it's due.`,
  };
}
