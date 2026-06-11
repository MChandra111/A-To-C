"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getApiError, readApiJson } from "@/lib/utils/api";
import { runAsync } from "@/lib/utils/async";
import { cn } from "@/lib/utils";
import {
  CHECK_IN_INTERVALS,
  HOURS_PER_WEEK_OPTIONS,
  type Aspiration,
  type CheckInInterval,
  type HoursPerWeek,
} from "@/types";
import {
  countCheckIns,
  formatHoursLabel,
  generateMonthYearOptions,
  getIntervalLabel,
  getIntervalNoun,
  getRecommendationCopy,
  monthsBetween,
  parseEndDateToMonthYear,
  recommendInterval,
  toEndDate,
} from "@/lib/utils/dateHelpers";

interface TimelineFormProps {
  aspiration: Aspiration;
}

function hoursToSliderIndex(hours: HoursPerWeek | null): number {
  if (hours === null) return 1;
  const index = HOURS_PER_WEEK_OPTIONS.indexOf(hours);
  return index >= 0 ? index : 1;
}

export function TimelineForm({ aspiration }: TimelineFormProps) {
  const router = useRouter();
  const monthYearOptions = useMemo(() => generateMonthYearOptions(), []);

  const parsedEnd = parseEndDateToMonthYear(aspiration.end_date);
  const defaultOption = monthYearOptions[Math.min(5, monthYearOptions.length - 1)];

  const [endMonth, setEndMonth] = useState(
    parsedEnd?.month ?? defaultOption.month
  );
  const [endYear, setEndYear] = useState(
    parsedEnd?.year ?? defaultOption.year
  );

  const initialMonths = useMemo(() => {
    const end = toEndDate(
      parsedEnd?.month ?? defaultOption.month,
      parsedEnd?.year ?? defaultOption.year
    );
    return monthsBetween(new Date(), end);
  }, [parsedEnd, defaultOption]);

  const [interval, setInterval] = useState<CheckInInterval>(
    aspiration.interval ?? recommendInterval(initialMonths)
  );
  const [hoursIndex, setHoursIndex] = useState(
    hoursToSliderIndex(aspiration.hours_per_week)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoursPerWeek = HOURS_PER_WEEK_OPTIONS[hoursIndex];
  const endDate = toEndDate(endMonth, endYear);
  const months = monthsBetween(new Date(), endDate);
  const recommendedInterval = recommendInterval(months);
  const checkInCount = countCheckIns(new Date(), endDate, interval);
  const intervalNoun = getIntervalNoun(interval);

  const selectedMonthYear = `${endYear}-${String(endMonth).padStart(2, "0")}`;

  function handleMonthYearChange(value: string) {
    const [year, month] = value.split("-").map(Number);
    setEndMonth(month);
    setEndYear(year);
  }

  async function handleSaveAndContinue() {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/aspirations/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          end_month: endMonth,
          end_year: endYear,
          interval,
          hours_per_week: hoursPerWeek,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiError(response, "Failed to save timeline")
        );
      }

      await readApiJson<{ aspiration_id: string }>(response);
      router.push("/roadmap/generating");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              When do you want to get there?
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Pick the month and year you&apos;re aiming for. No day precision
              needed — this sets the horizon your Investment Score measures
              against.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date">Target end date</Label>
          <select
            id="end-date"
            value={selectedMonthYear}
            onChange={(e) => handleMonthYearChange(e.target.value)}
            disabled={saving}
            className="flex h-10 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {monthYearOptions.map((option) => (
              <option
                key={`${option.year}-${option.month}`}
                value={`${option.year}-${String(option.month).padStart(2, "0")}`}
              >
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-muted">
            Between 1 month and 5 years from today.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              How often will you weigh in?
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              The interval is how often you step on the scale. Your Investment
              Score is built from these readings — not from completing tasks, but
              from showing up consistently.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Check-in interval</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CHECK_IN_INTERVALS.map((option) => {
              const isSelected = interval === option;
              const isRecommended = option === recommendedInterval;

              return (
                <button
                  key={option}
                  type="button"
                  disabled={saving}
                  onClick={() => setInterval(option)}
                  className={cn(
                    "relative rounded-lg border px-3 py-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/15"
                      : "border-border bg-surface-elevated hover:border-primary/50"
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      isSelected ? "text-text-primary" : "text-text-muted"
                    )}
                  >
                    {getIntervalLabel(option)}
                  </span>
                  {isRecommended && (
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-success">
                      Recommended
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-text-muted">
            {getRecommendationCopy(months, interval)}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Weekly time commitment (optional)
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              How much time per week can you dedicate? This shapes roadmap
              density — not your score.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="hours-slider">Hours per week</Label>
            <span className="font-mono text-sm text-primary">
              {formatHoursLabel(hoursPerWeek)}
            </span>
          </div>
          <input
            id="hours-slider"
            type="range"
            min={0}
            max={HOURS_PER_WEEK_OPTIONS.length - 1}
            step={1}
            value={hoursIndex}
            onChange={(e) => setHoursIndex(Number(e.target.value))}
            disabled={saving}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-elevated accent-primary"
          />
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-wide text-text-muted">
            {HOURS_PER_WEEK_OPTIONS.map((hours) => (
              <span key={hours}>{formatHoursLabel(hours)}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Your weigh-in schedule
        </p>
        <p className="mt-3 text-lg text-text-primary">
          That&apos;s approximately{" "}
          <span className="font-display font-bold text-primary">
            {checkInCount}
          </span>{" "}
          {intervalNoun} check-in{checkInCount === 1 ? "" : "s"} between now and
          your goal.
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Your Investment Score will be calculated from these readings for
          &ldquo;{aspiration.title}&rdquo;.
        </p>
      </div>

      {error && (
        <p className="text-sm text-decline" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/onboard/aspiration")}
          disabled={saving}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() =>
            runAsync(handleSaveAndContinue, (err) =>
              setError(err instanceof Error ? err.message : "Failed to save")
            )
          }
          disabled={saving}
        >
          {saving ? "Saving..." : "Generate my roadmap"}
        </Button>
      </div>
    </div>
  );
}
