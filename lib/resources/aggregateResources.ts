import type {
  LibraryResource,
  ResourceFormat,
  RoadmapMilestone,
  RoadmapResource,
} from "@/types";
import type { Aspiration } from "@/types";

export interface RoadmapResourceGroup {
  roadmapId: string;
  aspirationTitle: string;
  aspirationStatus: Aspiration["status"];
  category: string | null;
  resources: LibraryResource[];
}

function normalizeKey(name: string, url: string | null): string {
  if (url?.trim()) {
    try {
      const parsed = new URL(url);
      return parsed.href.toLowerCase().replace(/\/$/, "");
    } catch {
      return url.toLowerCase().trim();
    }
  }
  return name.toLowerCase().trim();
}

export function inferResourceFormat(
  name: string,
  url: string | null
): ResourceFormat {
  const haystack = `${name} ${url ?? ""}`.toLowerCase();

  if (/youtube|youtu\.be|vimeo/.test(haystack)) return "video";
  if (
    /coursera|udemy|edx|khan|ocw\.mit|pluralsight|skillshare|udacity/.test(
      haystack
    )
  ) {
    return "course";
  }
  if (/certif|certificate|cfa|pmp|comptia/.test(haystack)) return "certification";
  if (/leetcode|github\.com|notion|figma|anaconda/.test(haystack)) return "tool";
  if (/book|oreilly|amazon\.com\/.*\/dp\//.test(haystack)) return "book";

  return "article";
}

function pickSkillArea(
  milestone: RoadmapMilestone,
  skillsNeeded: string[] | null
): string {
  if (milestone.focus_areas.length > 0) {
    return milestone.focus_areas[0]!;
  }
  if (skillsNeeded && skillsNeeded.length > 0) {
    return skillsNeeded[0]!;
  }
  return "General";
}

function extractResourcesFromRoadmap(
  roadmapId: string,
  milestones: RoadmapMilestone[] | null,
  skillsNeeded: string[] | null
): LibraryResource[] {
  if (!milestones?.length) return [];

  const seen = new Map<string, LibraryResource>();

  for (const milestone of milestones) {
    const skillArea = pickSkillArea(milestone, skillsNeeded);

    for (const item of milestone.action_items) {
      for (const resource of item.resources) {
        const key = normalizeKey(resource.name, resource.url);
        const existing = seen.get(key);

        if (existing) {
          existing.mentionCount = (existing.mentionCount ?? 1) + 1;
          continue;
        }

        seen.set(key, toLibraryResource(roadmapId, resource, skillArea, milestone.label, key));
      }
    }
  }

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function toLibraryResource(
  roadmapId: string,
  resource: RoadmapResource,
  skillArea: string,
  milestoneLabel: string,
  key: string
): LibraryResource {
  return {
    id: `${roadmapId}-${key.slice(0, 48).replace(/[^a-z0-9-]/gi, "-")}`,
    name: resource.name,
    url: resource.url,
    cost: resource.cost,
    type: resource.type,
    skillArea,
    format: inferResourceFormat(resource.name, resource.url),
    mentionCount: 1,
    milestoneLabel,
  };
}

interface RoadmapRow {
  id: string;
  milestones: RoadmapMilestone[] | null;
  skills_needed: string[] | null;
  version: number;
  generated_at: string;
}

interface AspirationRow {
  id: string;
  title: string;
  category: string | null;
  status: Aspiration["status"];
  roadmaps: RoadmapRow[] | RoadmapRow | null;
}

function pickLatestRoadmap(
  roadmaps: AspirationRow["roadmaps"]
): RoadmapRow | null {
  if (!roadmaps) return null;
  const list = Array.isArray(roadmaps) ? roadmaps : [roadmaps];
  if (list.length === 0) return null;
  return [...list].sort((a, b) => b.version - a.version)[0] ?? null;
}

const STATUS_ORDER: Record<Aspiration["status"], number> = {
  active: 0,
  completed: 1,
  archived: 2,
};

export function buildResourceGroups(
  aspirations: AspirationRow[]
): RoadmapResourceGroup[] {
  const groups: RoadmapResourceGroup[] = [];

  for (const aspiration of aspirations) {
    const roadmap = pickLatestRoadmap(aspiration.roadmaps);
    if (!roadmap) continue;

    const resources = extractResourcesFromRoadmap(
      roadmap.id,
      roadmap.milestones,
      roadmap.skills_needed
    );

    groups.push({
      roadmapId: roadmap.id,
      aspirationTitle: aspiration.title,
      aspirationStatus: aspiration.status,
      category: aspiration.category,
      resources,
    });
  }

  return groups.sort((a, b) => {
    const statusDiff =
      STATUS_ORDER[a.aspirationStatus] - STATUS_ORDER[b.aspirationStatus];
    if (statusDiff !== 0) return statusDiff;
    return a.aspirationTitle.localeCompare(b.aspirationTitle);
  });
}
