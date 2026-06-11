import type { SupabaseClient } from "@supabase/supabase-js";

const DAILY_GENERATION_LIMIT = 3;

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
  const count = await countRoadmapGenerationsToday(supabase, userId);
  if (count >= DAILY_GENERATION_LIMIT) {
    throw new Error(
      `Daily generation limit reached (${DAILY_GENERATION_LIMIT} per day). Try again tomorrow.`
    );
  }
}
