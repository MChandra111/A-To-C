import type { SupabaseClient } from "@supabase/supabase-js";
import { countEligibleWeighInPeriods } from "@/lib/checkin/milestone";
import { addInterval } from "@/lib/dashboard/weighInSchedule";
import type { CheckInInterval } from "@/types";

export interface RepairProgressResult {
  roadmap_id: string;
  deleted_checkins: number;
  deleted_completions: number;
  reset_scores: boolean;
  kept_checkins: number;
  current_milestone_hint: string;
}

function assertNoError(error: { message: string } | null, step: string) {
  if (error) {
    throw new Error(`${step}: ${error.message}`);
  }
}

/** Full reset: wipe check-ins, completions, scores; restore baseline 0; Week 1. */
export async function resetAllRoadmapProgress(
  supabase: SupabaseClient,
  userId: string,
  roadmapId: string
): Promise<RepairProgressResult> {
  const { count: checkinCountBefore } = await supabase
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId);

  const { count: completionCountBefore } = await supabase
    .from("completions")
    .select("id", { count: "exact", head: true })
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId);

  const { error: scoresDeleteError } = await supabase
    .from("investment_scores")
    .delete()
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId);
  assertNoError(scoresDeleteError, "Could not reset investment scores");

  const { error: completionsDeleteError } = await supabase
    .from("completions")
    .delete()
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId);
  assertNoError(
    completionsDeleteError,
    "Could not reset objective completions (apply migration 002_checkin_delete_policies.sql)"
  );

  const { error: checkinsDeleteError } = await supabase
    .from("checkins")
    .delete()
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId);
  assertNoError(checkinsDeleteError, "Could not reset check-ins");

  const { error: scoreInsertError } = await supabase
    .from("investment_scores")
    .insert({
      user_id: userId,
      roadmap_id: roadmapId,
      score: 0,
      checkin_id: null,
    });
  assertNoError(scoreInsertError, "Could not restore baseline score");

  const { error: streakError } = await supabase
    .from("streaks")
    .update({
      current_streak: 0,
      longest_streak: 0,
      last_checkin_date: null,
    })
    .eq("user_id", userId);
  assertNoError(streakError, "Could not reset streak");

  const { count: completionsAfter } = await supabase
    .from("completions")
    .select("id", { count: "exact", head: true })
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId);

  if ((completionsAfter ?? 0) > 0) {
    throw new Error(
      "Completions were not cleared. Run supabase/migrations/002_checkin_delete_policies.sql in the Supabase SQL editor."
    );
  }

  return {
    roadmap_id: roadmapId,
    deleted_checkins: checkinCountBefore ?? 0,
    deleted_completions: completionCountBefore ?? 0,
    reset_scores: true,
    kept_checkins: 0,
    current_milestone_hint:
      "Restored to first milestone. All objectives and weigh-ins cleared; baseline score is 0.",
  };
}

/**
 * Remove check-ins that exceed the schedule, keeping at most one per opened period.
 */
export async function repairRoadmapProgress(
  supabase: SupabaseClient,
  userId: string,
  roadmapId: string,
  options: { resetAll?: boolean } = {}
): Promise<RepairProgressResult> {
  if (options.resetAll) {
    return resetAllRoadmapProgress(supabase, userId, roadmapId);
  }

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("baseline_date, aspirations(interval)")
    .eq("id", roadmapId)
    .single();

  if (!roadmap?.baseline_date) {
    throw new Error("Roadmap not found or missing baseline");
  }

  const rawAspiration = roadmap.aspirations;
  const aspiration = (
    Array.isArray(rawAspiration) ? rawAspiration[0] : rawAspiration
  ) as { interval: CheckInInterval } | null | undefined;
  const interval = aspiration?.interval;
  if (!interval) {
    throw new Error("Aspiration interval not set");
  }

  const { data: checkins } = await supabase
    .from("checkins")
    .select("id, completed_at")
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });

  const allCheckins = checkins ?? [];
  const eligible = countEligibleWeighInPeriods(roadmap.baseline_date, interval);
  const baseline = new Date(`${roadmap.baseline_date}T00:00:00`);
  let periodDue = addInterval(baseline, interval);
  let periodIndex = 0;
  const keepIds: string[] = [];

  for (const checkin of allCheckins) {
    if (periodIndex >= eligible) break;
    const at = new Date(checkin.completed_at);
    if (at.getTime() >= periodDue.getTime()) {
      keepIds.push(checkin.id);
      periodIndex++;
      periodDue = addInterval(periodDue, interval);
    }
  }

  const deleteCheckinIds = allCheckins
    .filter((c) => !keepIds.includes(c.id))
    .map((c) => c.id);

  if (deleteCheckinIds.length === 0) {
    return {
      roadmap_id: roadmapId,
      deleted_checkins: 0,
      deleted_completions: 0,
      reset_scores: false,
      kept_checkins: keepIds.length,
      current_milestone_hint: "No excess weigh-ins to remove.",
    };
  }

  const { error: scoresDeleteError } = await supabase
    .from("investment_scores")
    .delete()
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId);
  assertNoError(scoresDeleteError, "Could not reset scores");

  const { error: checkinsDeleteError } = await supabase
    .from("checkins")
    .delete()
    .in("id", deleteCheckinIds);
  assertNoError(checkinsDeleteError, "Could not remove excess check-ins");

  const { error: scoreInsertError } = await supabase
    .from("investment_scores")
    .insert({
      user_id: userId,
      roadmap_id: roadmapId,
      score: 0,
      checkin_id: null,
    });
  assertNoError(scoreInsertError, "Could not restore baseline score");

  return {
    roadmap_id: roadmapId,
    deleted_checkins: deleteCheckinIds.length,
    deleted_completions: 0,
    reset_scores: true,
    kept_checkins: keepIds.length,
    current_milestone_hint:
      keepIds.length === 0
        ? "Restored to first milestone (Week 1)"
        : `Kept ${keepIds.length} scheduled weigh-in(s)`,
  };
}
