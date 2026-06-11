import { z } from "zod";
import { generateCheckinResponse } from "@/lib/claude/generateCheckinResponse";
import { getMilestoneByIndex } from "@/lib/checkin/milestone";
import { resolveCurrentMilestoneIndex } from "@/lib/checkin/milestoneProgress";
import { validateWeighInWindow } from "@/lib/checkin/weighInGate";
import { createClient } from "@/lib/supabase/server";
import {
  computeInvestmentScore,
  type EffortLevel,
} from "@/lib/utils/investmentScore";
import { buildRoadmapTrend } from "@/lib/utils/scoreTrend";
import type { Aspiration, RoadmapMilestone } from "@/types";

const effortSchema = z.enum(["done", "partial", "skipped"]);

const bodySchema = z.object({
  roadmap_id: z.string().uuid(),
  milestone_index: z.number().int().min(0),
  effort_items: z
    .array(
      z.object({
        action_item_index: z.number().int().min(0),
        effort: effortSchema,
      })
    )
    .min(1),
  journal_entry: z.string().max(500).optional(),
});

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function intervalDays(interval: Aspiration["interval"]): number {
  switch (interval) {
    case "daily":
      return 1;
    case "weekly":
      return 7;
    case "biweekly":
      return 14;
    case "monthly":
      return 30;
    default:
      return 7;
  }
}

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
    const raw = await request.json();
    body = bodySchema.parse(raw);
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

  if (!aspiration.interval || !roadmap.baseline_date) {
    return Response.json(
      { error: "Roadmap is missing timeline data" },
      { status: 400 }
    );
  }

  const milestones = roadmap.milestones as RoadmapMilestone[] | null;

  const { data: existingCompletions } = await supabase
    .from("completions")
    .select("milestone_index, action_item_index, effort")
    .eq("roadmap_id", body.roadmap_id);

  const completionSnapshot = (existingCompletions ?? []).map((c) => ({
    milestone_index: c.milestone_index,
    action_item_index: c.action_item_index,
    effort: c.effort as EffortLevel,
  }));

  const expectedMilestoneIndex = resolveCurrentMilestoneIndex(
    milestones,
    completionSnapshot
  );

  if (body.milestone_index !== expectedMilestoneIndex) {
    return Response.json(
      { error: "Milestone does not match your current schedule position" },
      { status: 400 }
    );
  }

  const milestone = getMilestoneByIndex(milestones, body.milestone_index);

  if (!milestone) {
    return Response.json({ error: "Invalid milestone" }, { status: 400 });
  }

  const maxActionIndex = milestone.action_items.length - 1;
  for (const item of body.effort_items) {
    if (item.action_item_index > maxActionIndex) {
      return Response.json({ error: "Invalid action item index" }, { status: 400 });
    }
  }

  const { data: lastCheckinRow } = await supabase
    .from("checkins")
    .select("completed_at")
    .eq("roadmap_id", body.roadmap_id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastCheckin = lastCheckinRow
    ? new Date(lastCheckinRow.completed_at)
    : null;

  const gate = validateWeighInWindow(
    aspiration.interval,
    lastCheckin,
    roadmap.baseline_date
  );

  if (!gate.allowed) {
    return Response.json(
      {
        error: gate.errorMessage,
        next_due: gate.status.nextDue.toISOString(),
        can_weigh_in: false,
      },
      { status: 403 }
    );
  }

  const { data: latestScoreRow } = await supabase
    .from("investment_scores")
    .select("score")
    .eq("roadmap_id", body.roadmap_id)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const scoreBefore = latestScoreRow?.score ?? 0;
  const now = new Date();

  for (const item of body.effort_items) {
    await supabase
      .from("completions")
      .delete()
      .eq("roadmap_id", body.roadmap_id)
      .eq("user_id", user.id)
      .eq("milestone_index", body.milestone_index)
      .eq("action_item_index", item.action_item_index);
  }

  const completionRows = body.effort_items.map((item) => ({
    user_id: user.id,
    roadmap_id: body.roadmap_id,
    milestone_index: body.milestone_index,
    action_item_index: item.action_item_index,
    effort: item.effort as EffortLevel,
    completed_at: now.toISOString(),
  }));

  const { error: completionError } = await supabase
    .from("completions")
    .insert(completionRows);

  if (completionError) {
    return Response.json({ error: completionError.message }, { status: 500 });
  }

  const { data: allCheckins } = await supabase
    .from("checkins")
    .select("completed_at")
    .eq("roadmap_id", body.roadmap_id)
    .order("completed_at", { ascending: true });

  const { data: allCompletions } = await supabase
    .from("completions")
    .select("effort, completed_at")
    .eq("roadmap_id", body.roadmap_id)
    .order("completed_at", { ascending: true });

  const checkinsIncludingThis = [
    ...(allCheckins ?? []),
    { completed_at: now.toISOString() },
  ];

  const { data: streakRow } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak, last_checkin_date")
    .eq("user_id", user.id)
    .maybeSingle();

  const todayStr = startOfDay(now).toISOString().slice(0, 10);
  let newStreak = 1;

  if (streakRow?.last_checkin_date) {
    const last = startOfDay(
      new Date(`${streakRow.last_checkin_date}T00:00:00`)
    );
    const daysSince = Math.floor(
      (startOfDay(now).getTime() - last.getTime()) / (24 * 60 * 60 * 1000)
    );
    const grace = Math.ceil(intervalDays(aspiration.interval) * 1.5);

    if (daysSince === 0) {
      newStreak = streakRow.current_streak;
    } else if (daysSince <= grace) {
      newStreak = streakRow.current_streak + 1;
    } else {
      newStreak = 1;
    }
  }

  const scoreAfter = computeInvestmentScore({
    interval: aspiration.interval,
    baselineDate: roadmap.baseline_date,
    checkins: checkinsIncludingThis,
    completions: (allCompletions ?? []).map((c) => ({
      effort: c.effort as EffortLevel,
      completed_at: c.completed_at,
    })),
    currentStreak: newStreak,
    reference: now,
  });

  const doneCount = body.effort_items.filter((i) => i.effort === "done").length;
  const partialCount = body.effort_items.filter(
    (i) => i.effort === "partial"
  ).length;
  const skippedCount = body.effort_items.filter(
    (i) => i.effort === "skipped"
  ).length;

  let aiResponse: string;
  try {
    aiResponse = await generateCheckinResponse({
      aspirationTitle: aspiration.title,
      doneCount,
      partialCount,
      skippedCount,
      scoreBefore,
      scoreAfter,
    });
  } catch {
    aiResponse =
      "Your reading is recorded. Pick one skipped item and schedule it first next period.";
  }

  const { data: checkin, error: checkinError } = await supabase
    .from("checkins")
    .insert({
      user_id: user.id,
      roadmap_id: body.roadmap_id,
      milestone_index: body.milestone_index,
      journal_entry: body.journal_entry?.trim() || null,
      ai_response: aiResponse,
      score_before: scoreBefore,
      score_after: scoreAfter,
      completed_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (checkinError || !checkin) {
    return Response.json(
      { error: checkinError?.message ?? "Failed to save check-in" },
      { status: 500 }
    );
  }

  const { error: scoreError } = await supabase.from("investment_scores").insert({
    user_id: user.id,
    roadmap_id: body.roadmap_id,
    score: scoreAfter,
    checkin_id: checkin.id,
    recorded_at: now.toISOString(),
  });

  if (scoreError) {
    return Response.json({ error: scoreError.message }, { status: 500 });
  }

  const longestStreak = Math.max(
    streakRow?.longest_streak ?? 0,
    newStreak
  );

  if (streakRow) {
    await supabase
      .from("streaks")
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_checkin_date: todayStr,
      })
      .eq("user_id", user.id);
  } else {
    await supabase.from("streaks").insert({
      user_id: user.id,
      current_streak: newStreak,
      longest_streak: newStreak,
      last_checkin_date: todayStr,
    });
  }

  const { data: scoreHistory } = await supabase
    .from("investment_scores")
    .select("roadmap_id, score, recorded_at")
    .eq("roadmap_id", body.roadmap_id)
    .order("recorded_at", { ascending: true });

  const trend14 = buildRoadmapTrend(scoreHistory ?? [], body.roadmap_id, 14, now);

  return Response.json({
    ai_response: aiResponse,
    score_before: scoreBefore,
    score_after: scoreAfter,
    delta: scoreAfter - scoreBefore,
    new_streak: newStreak,
    trend14,
  });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roadmapId = new URL(request.url).searchParams.get("roadmap_id");
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

  const milestones = roadmap.milestones as RoadmapMilestone[] | null;

  const [{ data: completionRows }, { data: latestScore }] = await Promise.all([
    supabase
      .from("completions")
      .select("milestone_index, action_item_index, effort")
      .eq("roadmap_id", roadmapId),
    supabase
      .from("investment_scores")
      .select("score")
      .eq("roadmap_id", roadmapId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const completions = (completionRows ?? []).map((c) => ({
    milestone_index: c.milestone_index,
    action_item_index: c.action_item_index,
    effort: c.effort as EffortLevel,
  }));

  const milestoneIndex = resolveCurrentMilestoneIndex(milestones, completions);

  const milestone = getMilestoneByIndex(milestones, milestoneIndex);

  return Response.json({
    aspiration_title: aspiration.title,
    current_score: latestScore?.score ?? 0,
    milestone_index: milestoneIndex,
    milestone,
  });
}
