import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveScrapeModel } from "@/lib/claude/models";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
];

export function normalizeUrl(raw: string): string {
  const url = new URL(raw.trim());
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  if (
    (url.protocol === "https:" && url.port === "443") ||
    (url.protocol === "http:" && url.port === "80")
  ) {
    url.port = "";
  }

  for (const param of TRACKING_PARAMS) {
    url.searchParams.delete(param);
  }

  const sortedParams = [...url.searchParams.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  url.search = new URLSearchParams(sortedParams).toString();

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

export function getCacheTtlDays(): number {
  const parsed = Number(process.env.URL_REQUIREMENTS_CACHE_TTL_DAYS ?? "30");
  if (!Number.isFinite(parsed) || parsed < 1) return 30;
  return Math.floor(parsed);
}

export function getScrapeModel(): string {
  return resolveScrapeModel();
}

interface CachedRequirements {
  requirements_text: string;
  expires_at: string;
  hit_count: number;
}

export async function getCachedRequirements(
  supabase: SupabaseClient,
  normalizedUrl: string
): Promise<CachedRequirements | null> {
  const { data, error } = await supabase.rpc("get_cached_url_requirements", {
    p_normalized_url: normalizedUrl,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.requirements_text) return null;

  return row as CachedRequirements;
}

export async function setCachedRequirements(
  supabase: SupabaseClient,
  {
    normalizedUrl,
    sourceUrl,
    requirementsText,
    model,
  }: {
    normalizedUrl: string;
    sourceUrl: string;
    requirementsText: string;
    model: string;
  }
): Promise<void> {
  const { error } = await supabase.rpc("upsert_url_requirements_cache", {
    p_normalized_url: normalizedUrl,
    p_source_url: sourceUrl,
    p_requirements_text: requirementsText,
    p_model: model,
    p_ttl_days: getCacheTtlDays(),
  });

  if (error) {
    throw new Error(error.message);
  }
}
