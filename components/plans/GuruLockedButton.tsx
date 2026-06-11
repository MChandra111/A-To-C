"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuruLockedButtonProps {
  label: string;
  className?: string;
}

export function GuruLockedButton({ label, className }: GuruLockedButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      asChild
      className={cn("text-xs", className)}
    >
      <Link href="/upgrade" title="Available on the Guru plan">
        <Lock className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        {label}
      </Link>
    </Button>
  );
}
