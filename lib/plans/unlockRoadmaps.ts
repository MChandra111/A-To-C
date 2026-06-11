import { unlockRemainingMilestones } from "@/lib/claude/unlockRoadmap";
import { FREE_UNLOCKED_MILESTONES } from "@/lib/plans/constants";
import { getTotalMilestoneCount } from "@/lib/plans/roadmapAccess";
import { normalizeMilestoneIndices } from "@/lib/roadmap/normalizeMilestones";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Aspiration, Capability, Roadmap, RoadmapMilestone } from "@/types";

export interface UnlockRoadmapsResult {
  unlocked: number;
  skipped: number;
  errors: string[];
}

export function roadmapNeedsGuruUnlock(
  roadmap: {
    milestones: RoadmapMilestone[] | null;
    total_milestone_count?: number | null;
    cost_summary?: Roadmap["cost_summary"];
  },
  aspiration?: Pick<Aspiration, "end_date"> | null
): boolean {
  const stored = normalizeMilestoneIndices(roadmap.milestones);
  const total = getTotalMilestoneCount(roadmap, aspiration);
  const missingMilestones = stored.length < total;
  const missingCost = roadmap.cost_summary == null;
  return missingMilestones || missingCost;
}

export function freeRoadmapNeedsIntervalRepair(
  roadmap: Pick<Roadmap, "milestones">,
  aspiration?: Pick<Aspiration, "end_date"> | null
): boolean {
  const stored = normalizeMilestoneIndices(roadmap.milestones);
  if (stored.length >= FREE_UNLOCKED_MILESTONES) return false;
  const total = getTotalMilestoneCount(roadmap, aspiration);
  return total > stored.length;
}

/** Generate missing free-preview intervals (up to 2) for legacy partial roadmaps. */
export async function repairFreeRoadmapIntervals(
  userId: string,
  roadmapId: string
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { data: roadmap } = await admin
    .from("roadmaps")
    .select("*, aspirations(*)")
    .eq("id", roadmapId)
    .single();

  if (!roadmap) return false;

  const aspiration = roadmap.aspirations as Aspiration | null;
  if (!aspiration || aspiration.user_id !== userId) return false;
  if (!freeRoadmapNeedsIntervalRepair(roadmap as Roadmap, aspiration)) return false;
  if (!aspiration.end_date || !aspiration.interval) return false;

  const existingMilestones = normalizeMilestoneIndices(
    (roadmap.milestones ?? []) as RoadmapMilestone[]
  );
  const previewTarget = Math.min(
    FREE_UNLOCKED_MILESTONES,
    getTotalMilestoneCount(roadmap as Roadmap, aspiration)
  );
  const startFromIndex = existingMilestones.length;

  if (startFromIndex >= previewTarget) return false;

  const { data: capabilities } = await admin
    .from("capabilities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  let generated;
  try {
    generated = await unlockRemainingMilestones({
      aspiration,
      capabilities: (capabilities ?? []) as Capability[],
      existingMilestones,
      totalMilestoneCount: previewTarget,
      startFromIndex,
      includeCostSummary: false,
    });
  } catch (err) {
    console.error("Free interval repair failed:", err);
    return false;
  }

  const merged = normalizeMilestoneIndices([
    ...existingMilestones,
    ...generated.milestones.map((milestone, offset) => ({
      ...milestone,
      index: startFromIndex + offset,
    })),
  ]);

  const { error } = await admin
    .from("roadmaps")
    .update({ milestones: merged })
    .eq("id", roadmapId);

  return !error;
}

async function unlockSingleRoadmap(
  admin: SupabaseClient,
  userId: string,
  roadmap: Roadmap & { aspirations: Aspiration }
): Promise<{ unlocked: boolean; error?: string }> {
  if (!roadmapNeedsGuruUnlock(roadmap)) {
    return { unlocked: false };
  }

  const aspiration = roadmap.aspirations;
  if (!aspiration?.end_date || !aspiration.interval) {
    return { unlocked: false, error: "Aspiration timeline incomplete" };
  }

  const existingMilestones = normalizeMilestoneIndices(roadmap.milestones);
  const totalMilestoneCount = getTotalMilestoneCount(roadmap, aspiration);
  const startFromIndex = existingMilestones.length;
  const missingMilestones = startFromIndex < totalMilestoneCount;
  const includeCostSummary = roadmap.cost_summary == null;

  if (!missingMilestones && !includeCostSummary) {
    return { unlocked: false };
  }

  const { data: capabilities } = await admin
    .from("capabilities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  let generated;
  try {
    generated = await unlockRemainingMilestones({
      aspiration,
      capabilities: (capabilities ?? []) as Capability[],
      existingMilestones,
      totalMilestoneCount,
      startFromIndex,
      includeCostSummary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unlock generation failed";
    return { unlocked: false, error: message };
  }

  const mergedMilestones = missingMilestones
    ? normalizeMilestoneIndices([
        ...existingMilestones,
        ...generated.milestones.map((milestone, offset) => ({
          ...milestone,
          index: startFromIndex + offset,
        })),
      ])
    : existingMilestones;

  const { data: current } = await admin
    .from("roadmaps")
    .select("milestones, total_milestone_count, cost_summary, version")
    .eq("id", roadmap.id)
    .single();

  if (current && !roadmapNeedsGuruUnlock(current as Roadmap)) {
    return { unlocked: false };
  }

  const { error: updateError } = await admin
    .from("roadmaps")
    .update({
      milestones: mergedMilestones,
      cost_summary: generated.cost_summary ?? roadmap.cost_summary,
      version: (roadmap.version ?? 1) + 1,
    })
    .eq("id", roadmap.id);

  if (updateError) {
    return { unlocked: false, error: updateError.message };
  }

  return { unlocked: true };
}

/** Generate remaining milestones + cost summary for partial Free roadmaps. */
export async function ensureRoadmapsUnlockedForUser(
  userId: string
): Promise<UnlockRoadmapsResult> {
  const admin = createAdminClient();
  const result: UnlockRoadmapsResult = {
    unlocked: 0,
    skipped: 0,
    errors: [],
  };

  if (!admin) {
    result.errors.push("Admin client not configured");
    return result;
  }

  const { data: aspirations } = await admin
    .from("aspirations")
    .select(
      `
      *,
      roadmaps (*)
    `
    )
    .eq("user_id", userId);

  for (const row of aspirations ?? []) {
    const roadmaps = row.roadmaps;
    const list = Array.isArray(roadmaps)
      ? roadmaps
      : roadmaps
        ? [roadmaps]
        : [];

    for (const roadmapRow of list) {
      const roadmap = {
        ...(roadmapRow as Roadmap),
        aspirations: row as Aspiration,
      };

      if (!roadmapNeedsGuruUnlock(roadmap)) {
        result.skipped++;
        continue;
      }

      const outcome = await unlockSingleRoadmap(admin, userId, roadmap);
      if (outcome.error) {
        result.errors.push(outcome.error);
      } else if (outcome.unlocked) {
        result.unlocked++;
      } else {
        result.skipped++;
      }
    }
  }

  return result;
}
