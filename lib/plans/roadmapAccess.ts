import { FREE_UNLOCKED_MILESTONES } from "@/lib/plans/constants";
import { isGuruPlan } from "@/lib/plans/getUserPlan";
import { buildPlaceholderMilestone } from "@/lib/plans/placeholderMilestones";
import type {
  Aspiration,
  CheckInInterval,
  PlanTier,
  Roadmap,
  RoadmapMilestone,
} from "@/types";

export interface ResolvedRoadmapMilestones {
  milestones: RoadmapMilestone[];
  unlockedCount: number;
  totalCount: number;
  lockedFromIndex: number | null;
  hasLockedMilestones: boolean;
}

export function getTotalMilestoneCount(roadmap: {
  milestones: RoadmapMilestone[] | null;
  total_milestone_count?: number | null;
}): number {
  if (roadmap.total_milestone_count != null && roadmap.total_milestone_count > 0) {
    return roadmap.total_milestone_count;
  }
  return roadmap.milestones?.length ?? 0;
}

export function getUnlockedMilestoneCount(plan: PlanTier): number {
  return isGuruPlan(plan) ? Number.POSITIVE_INFINITY : FREE_UNLOCKED_MILESTONES;
}

export function getStoredMilestonesForPlan(
  milestones: RoadmapMilestone[] | null,
  plan: PlanTier
): RoadmapMilestone[] {
  const stored = [...(milestones ?? [])].sort((a, b) => a.index - b.index);
  if (isGuruPlan(plan)) return stored;
  return stored.filter((m) => m.index < FREE_UNLOCKED_MILESTONES);
}

export function resolveRoadmapMilestones(
  roadmap: Pick<Roadmap, "milestones" | "total_milestone_count">,
  aspiration: Pick<Aspiration, "interval">,
  plan: PlanTier
): ResolvedRoadmapMilestones {
  const interval = (aspiration.interval ?? "weekly") as CheckInInterval;
  const totalCount = getTotalMilestoneCount(roadmap);
  const stored = getStoredMilestonesForPlan(roadmap.milestones, plan);

  const lockedFromIndex = FREE_UNLOCKED_MILESTONES;
  const hasLockedMilestones =
    !isGuruPlan(plan) && totalCount > lockedFromIndex;

  if (!hasLockedMilestones) {
    return {
      milestones: stored,
      unlockedCount: stored.length,
      totalCount: Math.max(totalCount, stored.length),
      lockedFromIndex: null,
      hasLockedMilestones: false,
    };
  }

  const placeholders: RoadmapMilestone[] = [];
  for (let index = lockedFromIndex; index < totalCount; index++) {
    placeholders.push(buildPlaceholderMilestone(index, totalCount, interval));
  }

  return {
    milestones: [...stored, ...placeholders].sort((a, b) => a.index - b.index),
    unlockedCount: stored.length,
    totalCount,
    lockedFromIndex,
    hasLockedMilestones: true,
  };
}

export function isMilestoneLocked(
  milestoneIndex: number,
  plan: PlanTier,
  lockedFromIndex: number | null
): boolean {
  if (isGuruPlan(plan) || lockedFromIndex == null) return false;
  return milestoneIndex >= lockedFromIndex;
}

/** Strip Guru-only roadmap fields before sending to the client. */
export function sanitizeRoadmapForPlan<T extends Pick<Roadmap, "cost_summary">>(
  roadmap: T,
  plan: PlanTier
): T {
  if (isGuruPlan(plan)) return roadmap;
  return { ...roadmap, cost_summary: null };
}
