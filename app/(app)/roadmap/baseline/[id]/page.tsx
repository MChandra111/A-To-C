import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { BaselineReading } from "@/components/roadmap/BaselineReading";
import type { Aspiration, GapScoreData } from "@/types";

interface BaselinePageProps {
  params: Promise<{ id: string }>;
}

export default async function BaselinePage({ params }: BaselinePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("*, aspirations(*)")
    .eq("id", id)
    .single();

  if (!roadmap) notFound();

  const aspiration = roadmap.aspirations as Aspiration | null;
  if (!aspiration || aspiration.user_id !== user!.id) notFound();

  if (!roadmap.gap_score || !roadmap.gap_analysis) {
    redirect("/roadmap/generating");
  }

  return (
    <BaselineReading
      aspiration={aspiration}
      gapScore={roadmap.gap_score as GapScoreData}
      gapNarrative={roadmap.gap_analysis}
      roadmapId={roadmap.id}
    />
  );
}
