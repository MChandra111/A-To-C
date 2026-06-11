import Link from "next/link";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeighInButtonProps {
  roadmapId: string;
  canWeighIn: boolean;
  overdueDays?: number;
  className?: string;
  fullWidth?: boolean;
}

export function WeighInButton({
  roadmapId,
  canWeighIn,
  overdueDays = 0,
  className,
  fullWidth = false,
}: WeighInButtonProps) {
  if (!canWeighIn) return null;

  return (
    <Link
      href={`/checkin/${roadmapId}`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-colors",
        fullWidth ? "w-full" : "w-auto min-w-[9rem]",
        overdueDays > 0
          ? "bg-warning/15 text-warning ring-1 ring-warning/40 hover:bg-warning/25"
          : "bg-primary text-white hover:bg-primary-hover",
        className
      )}
    >
      <Scale className="h-4 w-4" aria-hidden />
      {overdueDays > 0 ? "Complete weigh-in" : "Weigh in now"}
    </Link>
  );
}
