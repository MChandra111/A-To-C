import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GapScore } from "@/components/score/GapScore";
import { InvestmentScore } from "@/components/score/InvestmentScore";
import { formatDurationSummary } from "@/lib/utils/dateHelpers";
import type { Aspiration, GapScoreData } from "@/types";

interface BaselineReadingProps {
  aspiration: Aspiration;
  gapScore: GapScoreData;
  gapNarrative: string;
  roadmapId: string;
}

export function BaselineReading({
  aspiration,
  gapScore,
  gapNarrative,
  roadmapId,
}: BaselineReadingProps) {
  const duration = formatDurationSummary(
    aspiration.end_date!,
    aspiration.interval!
  );

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-10">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Baseline reading
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
          {aspiration.title}
        </h1>
        <p className="mt-3 text-text-muted">
          Here is your reality, clearly stated. This is where you start.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-8">
        <InvestmentScore
          score={0}
          subtitle="This is where you start. Every check-in moves this number."
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <GapScore gapScore={gapScore} />
        <p className="mt-6 border-t border-border pt-6 text-sm leading-relaxed text-text-muted">
          {gapNarrative}
        </p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Distance to close
        </p>
        <p className="mt-3 text-lg text-text-primary">
          You have {duration} to close this gap.
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <Button asChild size="lg">
          <Link href={`/roadmap/${roadmapId}`}>See my roadmap →</Link>
        </Button>
      </div>
    </div>
  );
}
