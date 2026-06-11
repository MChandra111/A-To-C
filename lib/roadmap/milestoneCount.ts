const MAX_MILESTONES = 6;

export function getMilestoneCount(months: number): number {
  return Math.min(MAX_MILESTONES, Math.max(4, Math.ceil(months / 2)));
}

export { MAX_MILESTONES };
