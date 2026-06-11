/** URL requirement extraction — cheap, fast, good enough for summarization */
export const SCRAPE_MODEL = "claude-haiku-4-5-20251001";

/** Roadmap generation — complex JSON + gap analysis (Phase 5) */
export const ROADMAP_MODEL = "claude-sonnet-4-6";

/** Post check-in tactical nudge (Phase 7) */
export const CHECKIN_MODEL = "claude-haiku-4-5-20251001";

export function resolveScrapeModel(): string {
  return process.env.CLAUDE_SCRAPE_MODEL?.trim() || SCRAPE_MODEL;
}

export function resolveRoadmapModel(): string {
  return process.env.CLAUDE_ROADMAP_MODEL?.trim() || ROADMAP_MODEL;
}

export function resolveCheckinModel(): string {
  return process.env.CLAUDE_CHECKIN_MODEL?.trim() || CHECKIN_MODEL;
}
