import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidPublicUrl,
  scrapeAspirationUrl,
} from "@/lib/claude/scrapeAspiration";
import {
  getCachedRequirements,
  normalizeUrl,
  setCachedRequirements,
  getScrapeModel,
} from "@/lib/claude/urlCache";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() ?? "";
  const refresh = searchParams.get("refresh") === "true";

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  if (!isValidPublicUrl(url)) {
    return NextResponse.json(
      { error: "Enter a valid public http or https URL" },
      { status: 400 }
    );
  }

  const normalizedUrl = normalizeUrl(url);

  try {
    if (!refresh) {
      const cached = await getCachedRequirements(supabase, normalizedUrl);
      if (cached) {
        return NextResponse.json({
          requirements_text: cached.requirements_text,
          cached: true,
          expires_at: cached.expires_at,
        });
      }
    }

    const requirements_text = await scrapeAspirationUrl(url);

    try {
      await setCachedRequirements(supabase, {
        normalizedUrl,
        sourceUrl: url,
        requirementsText: requirements_text,
        model: getScrapeModel(),
      });
    } catch (cacheError) {
      console.error("Failed to write URL requirements cache:", cacheError);
    }

    return NextResponse.json({
      requirements_text,
      cached: false,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to extract requirements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
