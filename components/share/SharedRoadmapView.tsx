import { InvestmentScore } from "@/components/score/InvestmentScore";
import { ScoreTrend } from "@/components/score/ScoreTrend";
import { formatMonthYear } from "@/lib/utils/dateHelpers";
import type { SharedRoadmapData } from "@/lib/share/getSharedRoadmapData";

interface SharedRoadmapViewProps {
  data: SharedRoadmapData;
}

export function SharedRoadmapView({ data }: SharedRoadmapViewProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Accountability view · read only
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          {data.aspirationTitle}
        </h1>
        {data.category && (
          <p className="text-sm text-text-muted">{data.category}</p>
        )}
        {data.baselineDate && data.baselineGapScore != null && (
          <p className="font-mono text-xs text-text-muted">
            Started: Gap Score {data.baselineGapScore} ·{" "}
            {formatMonthYear(new Date(`${data.baselineDate}T00:00:00`))}
          </p>
        )}
      </header>

      <section className="rounded-xl border border-border bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Current reading
        </p>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <InvestmentScore score={data.investmentScore} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="mb-2 font-mono text-xs text-text-muted">
              30-day trend
            </p>
            <ScoreTrend data={data.trend30} height={72} showAxis />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Weigh-in history
        </h2>
        <p className="text-xs text-text-muted">
          Journal entries are private and not shown here.
        </p>

        {data.checkIns.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
            No weigh-ins recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {data.checkIns.map((checkin) => {
              const delta =
                checkin.score_before != null && checkin.score_after != null
                  ? checkin.score_after - checkin.score_before
                  : null;
              const date = new Date(checkin.completed_at).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" }
              );

              return (
                <li
                  key={checkin.completed_at}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="font-mono text-text-muted">{date}</span>
                  <span className="font-display text-lg font-bold text-text-primary">
                    {checkin.score_after ?? "—"}
                  </span>
                  {delta != null && (
                    <span
                      className={
                        delta >= 0 ? "text-success" : "text-decline"
                      }
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
