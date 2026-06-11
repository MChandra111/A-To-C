import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertCanCreateRoadmap } from "@/lib/plans/limits";
import { findOnboardingAspiration } from "@/lib/supabase/draftAspiration";
import { ASPIRATION_CATEGORIES, type AspirationCategory } from "@/types";

function isValidCategory(value: unknown): value is AspirationCategory | null {
  if (value === null || value === undefined || value === "") return true;
  return ASPIRATION_CATEGORIES.includes(value as AspirationCategory);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const category = body.category ?? null;
  const targetUrl =
    typeof body.target_url === "string" ? body.target_url.trim() : "";
  const scrapedRequirements =
    typeof body.scraped_requirements === "string"
      ? body.scraped_requirements.trim()
      : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!description) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  if (!isValidCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const payload = {
    title,
    description,
    category: category || null,
    target_url: targetUrl || null,
    scraped_requirements: scrapedRequirements || null,
  };

  let existingId: string | null = null;
  try {
    existingId = await findOnboardingAspiration(supabase, user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (existingId) {
    const { data, error } = await supabase
      .from("aspirations")
      .update(payload)
      .eq("id", existingId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ aspiration_id: data.id, aspiration: data });
  }

  try {
    await assertCanCreateRoadmap(supabase, user.id);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Roadmap limit reached";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("aspirations")
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ aspiration_id: data.id, aspiration: data });
}
