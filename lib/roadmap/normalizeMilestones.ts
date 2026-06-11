import type { RoadmapMilestone } from "@/types";

/** Ensure milestones are contiguous with indices 0…n−1 (Claude sometimes skips or offsets). */
export function normalizeMilestoneIndices(
  milestones: RoadmapMilestone[] | null | undefined
): RoadmapMilestone[] {
  if (!milestones?.length) return [];

  return [...milestones]
    .sort((a, b) => a.index - b.index)
    .map((milestone, index) => ({
      ...milestone,
      index,
    }));
}
