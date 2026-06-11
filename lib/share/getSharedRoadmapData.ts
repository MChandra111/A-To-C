import { createAdminClient } from "@/lib/supabase/admin";
import { buildRoadmapTrend } from "@/lib/utils/scoreTrend";
import type { ScorePoint } from "@/lib/utils/scoreTrend";
import type { Aspiration } from "@/types";

export interface SharedCheckInSummary {
  completed_at: string;
  score_before: number | null;
  score_after: number | null;
}

export interface SharedRoadmapData {
  aspirationTitle: string;
  category: string | null;
  investmentScore: number;
  trend30: ScorePoint[];
  checkIns: SharedCheckInSummary[];
  baselineGapScore: number | null;
  baselineDate: string | null;
}

export async function getSharedRoadmapData(
  token: string
): Promise<SharedRoadmapData | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: share } = await admin
    .from("roadmap_shares")
    .select("roadmap_id")
    .eq("share_token", token)
    .maybeSingle();

  if (!share) return null;

  const { data: roadmap } = await admin
    .from("roadmaps")
    .select("id, gap_score, baseline_date, aspirations(title, category)")
    .eq("id", share.roadmap_id)
    .single();

  if (!roadmap) return null;

  const rawAspiration = roadmap.aspirations;
  const aspiration = (
    Array.isArray(rawAspiration) ? rawAspiration[0] : rawAspiration
  ) as Pick<Aspiration, "title" | "category"> | null;

  if (!aspiration) return null;

  const [{ data: scoreRows }, { data: checkinRows }] = await Promise.all([
    admin
      .from("investment_scores")
      .select("roadmap_id, score, recorded_at")
      .eq("roadmap_id", share.roadmap_id)
      .order("recorded_at", { ascending: true }),
    admin
      .from("checkins")
      .select("completed_at, score_before, score_after")
      .eq("roadmap_id", share.roadmap_id)
      .order("completed_at", { ascending: false })
      .limit(20),
  ]);

  const rows = (scoreRows ?? []).map((r) => ({
    roadmap_id: r.roadmap_id,
    score: r.score,
    recorded_at: r.recorded_at,
  }));

  const gapScore = roadmap.gap_score as { overall?: number } | null;

  return {
    aspirationTitle: aspiration.title,
    category: aspiration.category,
    investmentScore: rows.length > 0 ? rows[rows.length - 1]!.score : 0,
    trend30: buildRoadmapTrend(rows, share.roadmap_id, 30),
    checkIns: (checkinRows ?? []).map((c) => ({
      completed_at: c.completed_at,
      score_before: c.score_before,
      score_after: c.score_after,
    })),
    baselineGapScore: gapScore?.overall ?? null,
    baselineDate: roadmap.baseline_date,
  };
}
