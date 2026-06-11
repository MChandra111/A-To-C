import { createClient } from "@/lib/supabase/server";

/** Returns Investment Score time-series for the authenticated user. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roadmapId = searchParams.get("roadmap_id");
  const format = searchParams.get("format") ?? "json";

  let query = supabase
    .from("investment_scores")
    .select("id, roadmap_id, score, recorded_at, checkin_id")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: true });

  if (roadmapId) {
    query = query.eq("roadmap_id", roadmapId);
  }

  const { data: rows, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const scores = rows ?? [];

  if (format === "csv") {
    const header = "recorded_at,roadmap_id,score,checkin_id";
    const lines = scores.map(
      (r) =>
        `${r.recorded_at},${r.roadmap_id},${r.score},${r.checkin_id ?? ""}`
    );
    const csv = [header, ...lines].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="investment-scores.csv"',
      },
    });
  }

  return Response.json({
    user_id: user.id,
    count: scores.length,
    scores,
  });
}
