import { z } from "zod";
import {
  buildEarlyFinishMessage,
  getMilestoneByIndex,
  getMilestoneObjectiveProgress,
  getNextMilestone,
  isActionItemDoneEarly,
  resolveCurrentMilestoneIndex,
} from "@/lib/checkin/milestoneProgress";
import { createClient } from "@/lib/supabase/server";
import type { Aspiration, RoadmapMilestone } from "@/types";

const bodySchema = z.object({
  roadmap_id: z.string().uuid(),
  milestone_index: z.number().int().min(0),
  action_item_index: z.number().int().min(0),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("*, aspirations(*)")
    .eq("id", body.roadmap_id)
    .single();

  if (!roadmap) {
    return Response.json({ error: "Roadmap not found" }, { status: 404 });
  }

  const aspiration = roadmap.aspirations as Aspiration | null;
  if (!aspiration || aspiration.user_id !== user.id) {
    return Response.json({ error: "Roadmap not found" }, { status: 404 });
  }

  const milestones = roadmap.milestones as RoadmapMilestone[] | null;
  const milestone = getMilestoneByIndex(milestones, body.milestone_index);

  if (!milestone) {
    return Response.json({ error: "Invalid milestone" }, { status: 400 });
  }

  if (body.action_item_index >= milestone.action_items.length) {
    return Response.json({ error: "Invalid action item" }, { status: 400 });
  }

  const { data: existingCompletions } = await supabase
    .from("completions")
    .select("milestone_index, action_item_index, effort")
    .eq("roadmap_id", body.roadmap_id)
    .eq("user_id", user.id);

  const completions = (existingCompletions ?? []).map((c) => ({
    milestone_index: c.milestone_index,
    action_item_index: c.action_item_index,
    effort: c.effort as "done" | "partial" | "skipped",
  }));

  const currentMilestoneIndex = resolveCurrentMilestoneIndex(
    milestones,
    completions
  );

  if (body.milestone_index !== currentMilestoneIndex) {
    return Response.json(
      {
        error:
          "You can only mark objectives early for your current period.",
      },
      { status: 400 }
    );
  }

  if (
    isActionItemDoneEarly(
      completions,
      body.milestone_index,
      body.action_item_index
    )
  ) {
    return Response.json(
      { error: "This objective is already marked done." },
      { status: 409 }
    );
  }

  await supabase
    .from("completions")
    .delete()
    .eq("roadmap_id", body.roadmap_id)
    .eq("user_id", user.id)
    .eq("milestone_index", body.milestone_index)
    .eq("action_item_index", body.action_item_index);

  const { error: insertError } = await supabase.from("completions").insert({
    user_id: user.id,
    roadmap_id: body.roadmap_id,
    milestone_index: body.milestone_index,
    action_item_index: body.action_item_index,
    effort: "done",
  });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const updatedCompletions = [
    ...completions.filter(
      (c) =>
        !(
          c.milestone_index === body.milestone_index &&
          c.action_item_index === body.action_item_index
        )
    ),
    {
      milestone_index: body.milestone_index,
      action_item_index: body.action_item_index,
      effort: "done" as const,
    },
  ];

  const progress = getMilestoneObjectiveProgress(milestone, updatedCompletions);
  const nextMilestone = getNextMilestone(milestones, body.milestone_index);
  const feedback = buildEarlyFinishMessage(milestone, progress, nextMilestone);
  const newCurrentIndex = resolveCurrentMilestoneIndex(
    milestones,
    updatedCompletions
  );

  return Response.json({
    feedback_type: feedback.type,
    message: feedback.message,
    progress,
    current_milestone_index: newCurrentIndex,
    advanced: feedback.type === "milestone",
    next_milestone_label: nextMilestone?.label ?? null,
  });
}
