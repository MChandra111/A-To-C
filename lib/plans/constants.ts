import type { PlanTier } from "@/types";

export const FREE_UNLOCKED_MILESTONES = 2;
export const FREE_MAX_ROADMAPS = 1;
export const DAILY_GENERATION_LIMIT_GURU = 3;

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  guru: "Guru",
};
