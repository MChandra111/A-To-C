import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
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

  const { data: existing } = await supabase
    .from("roadmap_shares")
    .select("share_token")
    .eq("roadmap_id", roadmapId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.share_token) {
    return Response.json({ share_token: existing.share_token });
  }

  const shareToken = randomBytes(24).toString("hex");

  const { data: created, error } = await supabase
    .from("roadmap_shares")
    .insert({
      roadmap_id: roadmapId,
      user_id: user.id,
      share_token: shareToken,
    })
    .select("share_token")
    .single();

  if (error || !created) {
    return Response.json(
      { error: error?.message ?? "Failed to create share link" },
      { status: 500 }
    );
  }

  return Response.json({ share_token: created.share_token });
}
