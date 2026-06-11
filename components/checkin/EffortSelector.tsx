"use client";

import { cn } from "@/lib/utils";
import type { EffortLevel } from "@/lib/utils/investmentScore";

const OPTIONS: { value: EffortLevel; label: string; symbol: string }[] = [
  { value: "done", label: "Done", symbol: "✓" },
  { value: "partial", label: "Partial", symbol: "◑" },
  { value: "skipped", label: "Skipped", symbol: "✗" },
];

interface EffortSelectorProps {
  value: EffortLevel | null;
  onChange: (effort: EffortLevel) => void;
  disabled?: boolean;
}

export function EffortSelector({
  value,
  onChange,
  disabled,
}: EffortSelectorProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Mark effort">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-12 flex-1 flex-col items-center justify-center rounded-xl border px-2 py-2 text-sm font-medium transition-colors",
              selected && option.value === "done" &&
                "border-success bg-success/15 text-success",
              selected && option.value === "partial" &&
                "border-warning bg-warning/15 text-warning",
              selected && option.value === "skipped" &&
                "border-decline bg-decline/15 text-decline",
              !selected &&
                "border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text-primary",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <span className="text-lg leading-none">{option.symbol}</span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-wide">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
