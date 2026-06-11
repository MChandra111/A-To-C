import { DAILY_GENERATION_LIMIT_GURU } from "@/lib/plans/constants";
import { getUserPlan, isGuruPlan } from "@/lib/plans/getUserPlan";
import { assertCanCreateRoadmap } from "@/lib/plans/limits";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function countRoadmapGenerationsToday(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: aspirations } = await supabase
    .from("aspirations")
    .select("id")
    .eq("user_id", userId);

  const aspirationIds = aspirations?.map((a) => a.id) ?? [];
  if (!aspirationIds.length) return 0;

  const { count, error } = await supabase
    .from("roadmaps")
    .select("*", { count: "exact", head: true })
    .in("aspiration_id", aspirationIds)
    .gte("generated_at", startOfDay.toISOString());

  if (error) throw error;
  return count ?? 0;
}

export async function assertGenerationAllowed(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const plan = await getUserPlan(supabase, userId);
  await assertCanCreateRoadmap(supabase, userId, plan);

  if (!isGuruPlan(plan)) return;

  const count = await countRoadmapGenerationsToday(supabase, userId);
  if (count >= DAILY_GENERATION_LIMIT_GURU) {
    throw new Error(
      `Daily generation limit reached (${DAILY_GENERATION_LIMIT_GURU} per day). Try again tomorrow.`
    );
  }
}
