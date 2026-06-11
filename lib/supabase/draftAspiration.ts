import type { SupabaseClient } from "@supabase/supabase-js";

/** Latest aspiration for this user that has not yet received a roadmap. */
export async function findOnboardingAspiration(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: aspirations, error } = await supabase
    .from("aspirations")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!aspirations?.length) return null;

  for (const aspiration of aspirations) {
    const { data: roadmap } = await supabase
      .from("roadmaps")
      .select("id")
      .eq("aspiration_id", aspiration.id)
      .maybeSingle();

    if (!roadmap) return aspiration.id;
  }

  return null;
}
