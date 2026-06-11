interface AiNudgeProps {
  message: string;
}

export function AiNudge({ message }: AiNudgeProps) {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 text-left">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
        Observation
      </p>
      <p className="mt-3 text-sm leading-relaxed text-text-primary">{message}</p>
    </div>
  );
}
