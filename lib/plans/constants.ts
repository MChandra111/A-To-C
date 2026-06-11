import type { PlanTier } from "@/types";

export const FREE_UNLOCKED_MILESTONES = 2;
export const FREE_MAX_ROADMAPS = 1;
export const DAILY_GENERATION_LIMIT_GURU = 3;

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  guru: "Guru",
};

export const GURU_PRICE_USD = 7;
export const GURU_PRICE_LABEL = "$7.00 USD";
export const GURU_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_GURU_CHECKOUT_URL ??
  "https://buy.stripe.com/test_eVq00i9hZc2z4kufl753O00";
