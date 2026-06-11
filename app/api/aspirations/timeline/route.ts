import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findOnboardingAspiration } from "@/lib/supabase/draftAspiration";
import {
  CHECK_IN_INTERVALS,
  HOURS_PER_WEEK_OPTIONS,
  type CheckInInterval,
  type HoursPerWeek,
} from "@/types";
import {
  isValidEndMonthYear,
  toEndDateString,
} from "@/lib/utils/dateHelpers";

function isValidInterval(value: unknown): value is CheckInInterval {
  return (
    typeof value === "string" &&
    CHECK_IN_INTERVALS.includes(value as CheckInInterval)
  );
}

function isValidHours(value: unknown): value is HoursPerWeek | null {
  if (value === null || value === undefined) return true;
  return (
    typeof value === "number" &&
    HOURS_PER_WEEK_OPTIONS.includes(value as HoursPerWeek)
  );
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
  const endMonth = Number(body.end_month);
  const endYear = Number(body.end_year);
  const interval = body.interval;
  const hoursPerWeek =
    body.hours_per_week === null || body.hours_per_week === undefined
      ? null
      : Number(body.hours_per_week);

  if (!isValidEndMonthYear(endMonth, endYear)) {
    return NextResponse.json(
      { error: "End date must be between 1 month and 5 years from today" },
      { status: 400 }
    );
  }

  if (!isValidInterval(interval)) {
    return NextResponse.json({ error: "Invalid check-in interval" }, { status: 400 });
  }

  if (!isValidHours(hoursPerWeek)) {
    return NextResponse.json(
      { error: "Hours per week must be 1, 3, 5, or 10" },
      { status: 400 }
    );
  }

  let aspirationId: string | null;
  try {
    aspirationId = await findOnboardingAspiration(supabase, user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!aspirationId) {
    return NextResponse.json(
      { error: "No aspiration found. Complete the aspiration step first." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("aspirations")
    .update({
      end_date: toEndDateString(endMonth, endYear),
      interval,
      hours_per_week: hoursPerWeek,
      status: "active",
    })
    .eq("id", aspirationId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ aspiration_id: data.id, aspiration: data });
}
