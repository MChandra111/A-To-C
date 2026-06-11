import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("capabilities")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_type", "text")
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("capabilities")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id, content")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ capability_id: data.id, content: data.content });
  }

  const { data, error } = await supabase
    .from("capabilities")
    .insert({
      user_id: user.id,
      content,
      source_type: "text",
    })
    .select("id, content")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ capability_id: data.id, content: data.content });
}
