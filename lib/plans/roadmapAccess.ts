import { FREE_UNLOCKED_MILESTONES } from "@/lib/plans/constants";
import { isGuruPlan } from "@/lib/plans/getUserPlan";
import { buildPlaceholderMilestone } from "@/lib/plans/placeholderMilestones";
import { getMilestoneCount } from "@/lib/roadmap/milestoneCount";
import { normalizeMilestoneIndices } from "@/lib/roadmap/normalizeMilestones";
import { monthsBetween } from "@/lib/utils/dateHelpers";
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

export function getTotalMilestoneCount(
  roadmap: {
    milestones: RoadmapMilestone[] | null;
    total_milestone_count?: number | null;
  },
  aspiration?: Pick<Aspiration, "end_date"> | null
): number {
  if (
    roadmap.total_milestone_count != null &&
    roadmap.total_milestone_count > 0
  ) {
    return roadmap.total_milestone_count;
  }

  const storedLen = normalizeMilestoneIndices(roadmap.milestones).length;
  if (storedLen > FREE_UNLOCKED_MILESTONES) return storedLen;

  if (aspiration?.end_date) {
    const end = new Date(`${aspiration.end_date}T00:00:00`);
    const months = Math.max(1, monthsBetween(new Date(), end));
    return getMilestoneCount(months);
  }

  return storedLen;
}

export function getUnlockedMilestoneCount(plan: PlanTier): number {
  return isGuruPlan(plan) ? Number.POSITIVE_INFINITY : FREE_UNLOCKED_MILESTONES;
}

export function getStoredMilestonesForPlan(
  milestones: RoadmapMilestone[] | null,
  plan: PlanTier
): RoadmapMilestone[] {
  const stored = normalizeMilestoneIndices(milestones);
  if (isGuruPlan(plan)) return stored;
  return stored.slice(0, FREE_UNLOCKED_MILESTONES);
}

export function resolveRoadmapMilestones(
  roadmap: Pick<Roadmap, "milestones" | "total_milestone_count">,
  aspiration: Pick<Aspiration, "interval" | "end_date">,
  plan: PlanTier
): ResolvedRoadmapMilestones {
  const interval = (aspiration.interval ?? "weekly") as CheckInInterval;
  const totalCount = getTotalMilestoneCount(roadmap, aspiration);
  const unlocked = getStoredMilestonesForPlan(roadmap.milestones, plan);

  if (isGuruPlan(plan) || unlocked.length >= totalCount) {
    return {
      milestones: unlocked,
      unlockedCount: unlocked.length,
      totalCount: Math.max(totalCount, unlocked.length),
      lockedFromIndex: null,
      hasLockedMilestones: false,
    };
  }

  const placeholders: RoadmapMilestone[] = [];
  for (let index = unlocked.length; index < totalCount; index++) {
    placeholders.push(buildPlaceholderMilestone(index, totalCount, interval));
  }

  const lockedFromIndex = unlocked.length;

  return {
    milestones: [...unlocked, ...placeholders],
    unlockedCount: unlocked.length,
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
