import { repairRoadmapProgress } from "@/lib/checkin/repairProgress";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: roadmapId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("id, aspirations(user_id)")
    .eq("id", roadmapId)
    .single();

  const rawAspiration = roadmap?.aspirations;
  const aspiration = (
    Array.isArray(rawAspiration) ? rawAspiration[0] : rawAspiration
  ) as { user_id: string } | null | undefined;
  if (!roadmap || !aspiration || aspiration.user_id !== user.id) {
    return Response.json({ error: "Roadmap not found" }, { status: 404 });
  }

  let resetAll = false;
  try {
    const body = await request.json();
    resetAll = body?.reset_all === true;
  } catch {
    resetAll = true;
  }

  try {
    const db = createAdminClient() ?? supabase;
    const result = await repairRoadmapProgress(db, user.id, roadmapId, {
      resetAll,
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Repair failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
