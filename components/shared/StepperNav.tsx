import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Capabilities", href: "/onboard/capabilities" },
  { number: 2, label: "Aspiration", href: "/onboard/aspiration" },
  { number: 3, label: "Timeline", href: "/onboard/timeline" },
] as const;

interface StepperNavProps {
  currentStep: 1 | 2 | 3;
}

export function StepperNav({ currentStep }: StepperNavProps) {
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center justify-between text-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Onboarding · Step {currentStep} of {STEPS.length}
        </p>
        <p className="text-text-muted">{Math.round(progress)}%</p>
      </div>

      <div className="mb-6 h-1 overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="flex gap-2 sm:gap-4">
        {STEPS.map((step) => {
          const isActive = step.number === currentStep;
          const isComplete = step.number < currentStep;

          return (
            <li
              key={step.number}
              className={cn(
                "flex flex-1 flex-col gap-1 rounded-lg border px-3 py-2 sm:px-4",
                isActive
                  ? "border-primary bg-primary/10"
                  : isComplete
                    ? "border-success/40 bg-success/5"
                    : "border-border bg-surface"
              )}
            >
              <span
                className={cn(
                  "font-mono text-xs",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              >
                {step.number}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-text-primary" : "text-text-muted"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
