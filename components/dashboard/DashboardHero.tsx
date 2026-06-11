"use client";

import { useState } from "react";
import { InvestmentScore } from "@/components/score/InvestmentScore";
import { ScoreTrend } from "@/components/score/ScoreTrend";
import { cn } from "@/lib/utils";
import type { ScorePoint, TrendPeriod } from "@/lib/utils/scoreTrend";

const PERIODS: TrendPeriod[] = [30, 60, 90];

interface DashboardHeroProps {
  overallScore: number;
  trends: Record<TrendPeriod, ScorePoint[]>;
  streak: {
    current: number;
    longest: number;
    lastCheckinDaysAgo: number | null;
  };
  nextWeighInLabel: string | null;
}

function formatStreakLabel(streak: DashboardHeroProps["streak"]): string {
  if (streak.current > 0) {
    const unit = streak.current === 1 ? "week" : "weeks";
    return `${streak.current}-${unit} streak`;
  }

  if (streak.lastCheckinDaysAgo === null) {
    return "No weigh-ins yet";
  }

  if (streak.lastCheckinDaysAgo === 0) {
    return "Last check-in: today";
  }

  if (streak.lastCheckinDaysAgo === 1) {
    return "Last check-in: yesterday";
  }

  return `Last check-in: ${streak.lastCheckinDaysAgo} days ago`;
}

export function DashboardHero({
  overallScore,
  trends,
  streak,
  nextWeighInLabel,
}: DashboardHeroProps) {
  const [period, setPeriod] = useState<TrendPeriod>(30);
  const trendData = trends[period];

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <InvestmentScore
          score={overallScore}
          label="Overall Investment Score"
          subtitle="The number on the scale. One reading is noise — the line is the signal."
          size="lg"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
              {period}-day trend
            </p>
            <div className="flex gap-1 rounded-lg bg-surface-elevated p-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-md px-3 py-1 font-mono text-xs transition-colors",
                    period === p
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {p}d
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-surface-elevated/40">
            <ScoreTrend data={trendData} height={96} showAxis />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <p className="font-mono text-xs text-text-muted">
              {formatStreakLabel(streak)}
            </p>
            {nextWeighInLabel && (
              <p className="font-mono text-xs text-text-muted">
                {nextWeighInLabel}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
