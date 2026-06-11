import type { LibraryResource } from "@/types";
import { PLACEHOLDER_RESOURCES } from "./placeholderResources";

/**
 * Returns resources for the library view.
 *
 * TODO: populate from roadmap completions — query roadmaps for this user,
 * extract resources from milestone action_items, dedupe, rank by frequency,
 * and merge skill-area tags from skills_needed / focus_areas.
 */
export async function getResourceLibrary(_userId: string): Promise<LibraryResource[]> {
  return PLACEHOLDER_RESOURCES;
}
