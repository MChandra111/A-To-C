import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_MAX_ROADMAPS } from "@/lib/plans/constants";
import { getUserPlan, isGuruPlan } from "@/lib/plans/getUserPlan";
import type { PlanTier } from "@/types";

export async function countUserRoadmaps(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: aspirations } = await supabase
    .from("aspirations")
    .select("id")
    .eq("user_id", userId);

  const aspirationIds = aspirations?.map((a) => a.id) ?? [];
  if (!aspirationIds.length) return 0;

  const { count, error } = await supabase
    .from("roadmaps")
    .select("*", { count: "exact", head: true })
    .in("aspiration_id", aspirationIds);

  if (error) throw error;
  return count ?? 0;
}

export async function assertCanCreateRoadmap(
  supabase: SupabaseClient,
  userId: string,
  plan?: PlanTier
): Promise<void> {
  const tier = plan ?? (await getUserPlan(supabase, userId));
  if (isGuruPlan(tier)) return;

  const count = await countUserRoadmaps(supabase, userId);
  if (count >= FREE_MAX_ROADMAPS) {
    throw new Error(
      "Free plan includes one roadmap. Upgrade to Guru to create another."
    );
  }
}

export async function assertGuruPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanTier> {
  const plan = await getUserPlan(supabase, userId);
  if (!isGuruPlan(plan)) {
    throw new Error("This feature requires the Guru plan.");
  }
  return plan;
}
