import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { findOnboardingAspiration } from "@/lib/supabase/draftAspiration";
import { RoadmapGenerating } from "@/components/roadmap/RoadmapGenerating";

export default async function RoadmapGeneratingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const aspirationId = await findOnboardingAspiration(supabase, user!.id);

  if (!aspirationId) {
    redirect("/onboard/aspiration");
  }

  const { data: aspiration } = await supabase
    .from("aspirations")
    .select("id, title, end_date, interval")
    .eq("id", aspirationId)
    .single();

  if (!aspiration?.end_date || !aspiration?.interval) {
    redirect("/onboard/timeline");
  }

  const { data: existingRoadmap } = await supabase
    .from("roadmaps")
    .select("id")
    .eq("aspiration_id", aspirationId)
    .maybeSingle();

  if (existingRoadmap) {
    redirect(`/roadmap/baseline/${existingRoadmap.id}`);
  }

  return (
    <RoadmapGenerating
      aspirationId={aspiration.id}
      aspirationTitle={aspiration.title}
    />
  );
}
