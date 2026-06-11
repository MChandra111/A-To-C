import {
  buildResourceGroups,
  type RoadmapResourceGroup,
} from "@/lib/resources/aggregateResources";
import { createClient } from "@/lib/supabase/server";
import type { Aspiration, RoadmapMilestone } from "@/types";

export type { RoadmapResourceGroup };

export async function getResourceLibrary(): Promise<RoadmapResourceGroup[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: aspirations } = await supabase
    .from("aspirations")
    .select(
      `
      id,
      title,
      category,
      status,
      roadmaps (
        id,
        milestones,
        skills_needed,
        version,
        generated_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const groups = buildResourceGroups(
    (aspirations ?? []).map((row) => {
      const roadmaps = row.roadmaps ?? [];
      const list = Array.isArray(roadmaps) ? roadmaps : [roadmaps];

      return {
        id: row.id,
        title: row.title,
        category: row.category,
        status: row.status as Aspiration["status"],
        roadmaps: list.map((r) => ({
          id: r.id,
          milestones: r.milestones as RoadmapMilestone[] | null,
          skills_needed: r.skills_needed as string[] | null,
          version: r.version,
          generated_at: r.generated_at,
        })),
      };
    })
  );

  return groups;
}
