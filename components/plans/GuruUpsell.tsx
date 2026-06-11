import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuruUpsellProps {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

export function GuruUpsell({
  title = "Unlock with Guru",
  description = "Upgrade to Guru for the full roadmap, reminders, finish-early, and unlimited goals.",
  compact = false,
  className,
}: GuruUpsellProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/30 bg-primary/5",
        compact ? "p-4" : "p-6",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Lock className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="text-sm text-text-muted">{description}</p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/upgrade">Get Guru</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
