import { createClient } from "@/lib/supabase/server";
import { regenerateRoadmapMilestones } from "@/lib/claude/regenerateRoadmap";
import { getLastFullyCompletedMilestoneIndex } from "@/lib/checkin/milestoneProgress";
import type { Aspiration, Capability, RoadmapMilestone } from "@/types";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    roadmap_id?: string;
    new_end_date?: string;
    new_interval?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const roadmapId = body.roadmap_id?.trim();
  if (!roadmapId) {
    return Response.json({ error: "roadmap_id is required" }, { status: 400 });
  }

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("*, aspirations(*)")
    .eq("id", roadmapId)
    .single();

  if (!roadmap) {
    return Response.json({ error: "Roadmap not found" }, { status: 404 });
  }

  const aspiration = roadmap.aspirations as Aspiration | null;
  if (!aspiration || aspiration.user_id !== user.id) {
    return Response.json({ error: "Roadmap not found" }, { status: 404 });
  }

  if (body.new_end_date) {
    await supabase
      .from("aspirations")
      .update({ end_date: body.new_end_date })
      .eq("id", aspiration.id);
    aspiration.end_date = body.new_end_date;
  }

  if (body.new_interval) {
    await supabase
      .from("aspirations")
      .update({ interval: body.new_interval })
      .eq("id", aspiration.id);
    aspiration.interval = body.new_interval as Aspiration["interval"];
  }

  const { data: completions } = await supabase
    .from("completions")
    .select("milestone_index, action_item_index, effort")
    .eq("roadmap_id", roadmapId);

  const completionRows = (completions ?? []).map((c) => ({
    milestone_index: c.milestone_index,
    action_item_index: c.action_item_index,
    effort: c.effort as "done" | "partial" | "skipped",
  }));

  const existingMilestones = (roadmap.milestones ?? []) as RoadmapMilestone[];
  const lastCompleted = getLastFullyCompletedMilestoneIndex(
    existingMilestones,
    completionRows
  );

  const preserved = existingMilestones
    .filter((m) => m.index <= lastCompleted)
    .sort((a, b) => a.index - b.index);

  const startFromIndex = lastCompleted + 1;

  const { data: capabilities } = await supabase
    .from("capabilities")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  let regenerated;

  try {
    regenerated = await regenerateRoadmapMilestones({
      aspiration,
      capabilities: (capabilities ?? []) as Capability[],
      preservedMilestones: preserved,
      startFromIndex,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Regeneration failed";
    return Response.json({ error: message }, { status: 500 });
  }

  const mergedMilestones = [
    ...preserved,
    ...regenerated.milestones.map((m, i) => ({
      ...m,
      index: startFromIndex + i,
    })),
  ];

  const { error: updateError } = await supabase
    .from("roadmaps")
    .update({
      milestones: mergedMilestones,
      cost_summary: regenerated.cost_summary ?? roadmap.cost_summary,
      version: (roadmap.version ?? 1) + 1,
    })
    .eq("id", roadmapId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  const preservedLabel =
    preserved.length > 0
      ? preserved[preserved.length - 1]!.label
      : "the start";

  return Response.json({
    roadmap_id: roadmapId,
    version: (roadmap.version ?? 1) + 1,
    preserved_through: preservedLabel,
    message: `Roadmap recalculated from ${preservedLabel}. Completed milestones preserved.`,
  });
}
