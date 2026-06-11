import { DownloadPdfButton } from "@/components/export/DownloadPdfButton";
import { GapScore } from "@/components/score/GapScore";
import { InvestmentScore } from "@/components/score/InvestmentScore";
import { MilestoneTimeline } from "@/components/roadmap/MilestoneTimeline";
import { RecalibratePanel } from "@/components/roadmap/RecalibratePanel";
import { RepairProgressButton } from "@/components/roadmap/RepairProgressButton";
import { ShareRoadmapButton } from "@/components/roadmap/ShareRoadmapButton";
import type { ActionCompletion } from "@/lib/checkin/milestoneProgress";
import { formatMonthYear } from "@/lib/utils/dateHelpers";
import type { Aspiration, Roadmap } from "@/types";

interface RoadmapViewProps {
  roadmap: Roadmap;
  aspiration: Aspiration;
  investmentScore?: number;
  completions?: ActionCompletion[];
  currentMilestoneIndex?: number;
  showRecalibrate?: boolean;
}

export function RoadmapView({
  roadmap,
  aspiration,
  investmentScore = 0,
  completions = [],
  currentMilestoneIndex = 0,
  showRecalibrate = false,
}: RoadmapViewProps) {
  const gapScore = roadmap.gap_score;
  const endDate = aspiration.end_date
    ? new Date(`${aspiration.end_date}T00:00:00`)
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <header className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
              Roadmap
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-text-primary">
              {aspiration.title}
            </h1>
            {endDate && (
              <p className="mt-2 text-sm text-text-muted">
                Target: {formatMonthYear(endDate)} · Check in{" "}
                {aspiration.interval}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <DownloadPdfButton scope="roadmap" roadmapId={roadmap.id} />
            {gapScore && (
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Gap Score
                </p>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {gapScore.overall}
                </p>
              </div>
            )}
            <InvestmentScore score={investmentScore} size="md" />
          </div>
        </div>
        {roadmap.baseline_date && gapScore && (
          <p className="font-mono text-xs text-text-muted">
            Started: Gap Score {gapScore.overall} ·{" "}
            {formatMonthYear(new Date(`${roadmap.baseline_date}T00:00:00`))}
          </p>
        )}
      </header>

      {roadmap.gap_analysis && gapScore && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Gap analysis
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
            {roadmap.gap_analysis}
          </p>
          <GapScore gapScore={gapScore} />
        </section>
      )}

      {roadmap.skills_needed && roadmap.skills_needed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Skills needed
          </h2>
          <div className="flex flex-wrap gap-2">
            {roadmap.skills_needed.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {roadmap.quick_wins && roadmap.quick_wins.length > 0 && (
        <section className="rounded-xl border border-success/30 bg-success/5 p-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Quick wins — next 48 hours
          </h2>
          <ul className="mt-4 space-y-3">
            {roadmap.quick_wins.map((win, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="font-mono text-success">{index + 1}.</span>
                <div>
                  <p className="text-text-primary">{win.action}</p>
                  <p className="text-xs text-text-muted">{win.time_estimate}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {roadmap.risk_factors && roadmap.risk_factors.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Risk factors
          </h2>
          <div className="space-y-3">
            {roadmap.risk_factors.map((factor, index) => (
              <details
                key={index}
                className="rounded-xl border border-warning/30 bg-warning/5 p-4"
              >
                <summary className="cursor-pointer text-sm font-medium text-warning">
                  {factor.risk}
                </summary>
                <p className="mt-3 text-sm text-text-muted">
                  {factor.mitigation}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {roadmap.milestones && roadmap.milestones.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Milestone timeline
          </h2>
          <MilestoneTimeline
            roadmapId={roadmap.id}
            milestones={roadmap.milestones}
            completions={completions}
            currentMilestoneIndex={currentMilestoneIndex}
          />
        </section>
      )}

      {roadmap.cost_summary && (
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Cost summary
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Free path
              </dt>
              <dd className="mt-1 text-sm text-text-primary">
                {roadmap.cost_summary.free_path_estimate}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Paid path
              </dt>
              <dd className="mt-1 text-sm text-text-primary">
                {roadmap.cost_summary.paid_path_estimate}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Recommended
              </dt>
              <dd className="mt-1 text-sm text-text-primary">
                {roadmap.cost_summary.recommended_path_cost}
              </dd>
            </div>
          </dl>
          {roadmap.cost_summary.notes && (
            <p className="mt-4 border-t border-border pt-4 text-sm text-text-muted">
              {roadmap.cost_summary.notes}
            </p>
          )}
        </section>
      )}

      <section className="grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
        <ShareRoadmapButton roadmapId={roadmap.id} />
        <RecalibratePanel
          roadmapId={roadmap.id}
          aspirationTitle={aspiration.title}
          currentEndDate={aspiration.end_date}
          currentInterval={aspiration.interval}
          defaultOpen={showRecalibrate}
        />
      </section>

      <RepairProgressButton roadmapId={roadmap.id} />
    </div>
  );
}
