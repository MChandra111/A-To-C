import type { GapScoreData } from "@/types";

interface GapScoreProps {
  gapScore: GapScoreData;
}

export function GapScore({ gapScore }: GapScoreProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Gap Score
        </p>
        <p className="font-display text-3xl font-bold text-text-primary">
          {gapScore.overall}
          <span className="text-lg text-text-muted">/100</span>
        </p>
      </div>

      <ul className="space-y-3">
        {gapScore.dimensions.map((dimension) => (
          <li key={dimension.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-text-primary">{dimension.name}</span>
              <span className="font-mono text-text-muted">
                {dimension.score}/100
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${dimension.score}%` }}
              />
            </div>
            <p className="text-xs text-text-muted">{dimension.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
