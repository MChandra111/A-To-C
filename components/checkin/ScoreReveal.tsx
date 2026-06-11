"use client";

import { useEffect, useState } from "react";
import { InvestmentScore } from "@/components/score/InvestmentScore";
import { ScoreTrend } from "@/components/score/ScoreTrend";
import { cn } from "@/lib/utils";
import type { ScorePoint } from "@/lib/utils/scoreTrend";

interface ScoreRevealProps {
  scoreBefore: number;
  scoreAfter: number;
  trend14: ScorePoint[];
}

export function ScoreReveal({
  scoreBefore,
  scoreAfter,
  trend14,
}: ScoreRevealProps) {
  const [displayScore, setDisplayScore] = useState(scoreBefore);
  const delta = scoreAfter - scoreBefore;

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const diff = scoreAfter - scoreBefore;

    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(scoreBefore + diff * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scoreBefore, scoreAfter]);

  return (
    <div className="flex w-full max-w-md flex-col items-center text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
        New reading
      </p>

      <InvestmentScore
        score={displayScore}
        label="Investment Score"
        size="lg"
        className="mt-2"
      />

      <p
        className={cn(
          "mt-2 font-mono text-lg font-medium",
          delta > 0 && "text-success",
          delta < 0 && "text-decline",
          delta === 0 && "text-text-muted"
        )}
      >
        {delta > 0 && `+${delta} points`}
        {delta < 0 && `${delta} points`}
        {delta === 0 && "No change"}
      </p>

      <div className="mt-8 w-full overflow-hidden rounded-lg bg-surface-elevated/40">
        <ScoreTrend data={trend14} height={64} />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
        14-day trend
      </p>
    </div>
  );
}
