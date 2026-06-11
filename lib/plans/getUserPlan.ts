import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanTier } from "@/types";

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanTier> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .single();

  if (error || !data?.plan_tier) return "free";
  return data.plan_tier === "guru" ? "guru" : "free";
}

export function isGuruPlan(plan: PlanTier): boolean {
  return plan === "guru";
}
