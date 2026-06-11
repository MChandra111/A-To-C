"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ScorePoint } from "@/lib/utils/scoreTrend";

interface ScoreTrendProps {
  data: ScorePoint[];
  height?: number;
  className?: string;
  showAxis?: boolean;
}

export function ScoreTrend({
  data,
  height = 80,
  className,
  showAxis = false,
}: ScoreTrendProps) {
  const { path, areaPath, trend, lastScore } = useMemo(() => {
    if (data.length < 2) {
      const score = data[0]?.score ?? 0;
      return {
        path: "",
        areaPath: "",
        trend: "flat" as const,
        lastScore: score,
      };
    }

    const width = 100;
    const padding = 4;
    const innerH = height - padding * 2;
    const scores = data.map((d) => d.score);
    const min = Math.min(...scores, 0);
    const max = Math.max(...scores, 100);
    const range = max - min || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = padding + innerH - ((d.score - min) / range) * innerH;
      return { x, y, score: d.score };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");

    const area =
      linePath +
      ` L ${width} ${height} L 0 ${height} Z`;

    const first = data[0]!.score;
    const last = data[data.length - 1]!.score;
    const delta = last - first;
    const trendDir =
      delta > 2 ? "up" : delta < -2 ? "down" : ("flat" as const);

    return {
      path: linePath,
      areaPath: area,
      trend: trendDir,
      lastScore: last,
    };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-border bg-surface/50",
          className
        )}
        style={{ height }}
      >
        <p className="font-mono text-xs text-text-muted">No readings yet</p>
      </div>
    );
  }

  const strokeColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-decline"
        : "text-primary";

  return (
    <div className={cn("relative w-full", className)}>
      <div className="overflow-hidden" style={{ height }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="block h-full w-full"
          role="img"
          aria-label={`Investment score trend, currently ${lastScore}`}
        >
          {areaPath && (
            <path
              d={areaPath}
              className={cn("fill-current opacity-10", strokeColor)}
            />
          )}
          {path && (
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="butt"
              strokeLinejoin="round"
              className={strokeColor}
            />
          )}
        </svg>
      </div>
      {showAxis && data.length > 0 && (
        <div className="mt-1 flex justify-between font-mono text-[10px] text-text-muted">
          <span>{data[0]!.date.slice(5)}</span>
          <span>{data[data.length - 1]!.date.slice(5)}</span>
        </div>
      )}
    </div>
  );
}
