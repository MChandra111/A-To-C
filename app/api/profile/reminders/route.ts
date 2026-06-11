import { NextResponse } from "next/server";
import { assertGuruPlan } from "@/lib/plans/limits";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { enabled?: boolean; day?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const enabled = Boolean(body.enabled);
  const day =
    typeof body.day === "number" && body.day >= 0 && body.day <= 6
      ? body.day
      : 1;

  if (enabled) {
    try {
      await assertGuruPlan(supabase, user.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Guru plan required";
      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      reminder_enabled: enabled,
      reminder_day_of_week: enabled ? day : null,
      reminder_time: enabled ? "14:00:00" : null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
