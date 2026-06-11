import { cn } from "@/lib/utils";

interface InvestmentScoreProps {
  score: number;
  label?: string;
  subtitle?: string;
  size?: "md" | "lg";
  className?: string;
}

export function InvestmentScore({
  score,
  label = "Investment Score",
  subtitle,
  size = "lg",
  className,
}: InvestmentScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const ringPercent = clamped;

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
        {label}
      </p>
      <div
        className={cn(
          "relative mt-4 flex items-center justify-center",
          size === "lg" ? "h-40 w-40" : "h-28 w-28"
        )}
      >
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-surface-elevated"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${ringPercent * 2.76} 276`}
            className="text-primary transition-all duration-700"
          />
        </svg>
        <span
          className={cn(
            "font-display font-bold text-text-primary",
            size === "lg" ? "text-5xl" : "text-3xl"
          )}
        >
          {clamped}
        </span>
      </div>
      {subtitle && (
        <p className="mt-4 max-w-sm text-sm text-text-muted">{subtitle}</p>
      )}
    </div>
  );
}
