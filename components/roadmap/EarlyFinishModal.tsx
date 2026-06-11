"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EarlyFinishModalProps {
  open: boolean;
  type: "item" | "milestone";
  message: string;
  onClose: () => void;
}

export function EarlyFinishModal({
  open,
  type,
  message,
  onClose,
}: EarlyFinishModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-finish-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border bg-surface p-8 shadow-xl",
          type === "milestone" ? "border-success/40" : "border-border"
        )}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {type === "milestone" ? "Milestone complete" : "Objective complete"}
        </p>
        <h2
          id="early-finish-title"
          className={cn(
            "mt-2 font-display text-3xl font-bold",
            type === "milestone" ? "text-success" : "text-text-primary"
          )}
        >
          {type === "milestone" ? "Congratulations!" : "Nice work."}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-text-muted">{message}</p>
        <Button type="button" className="mt-8 w-full" onClick={onClose}>
          Continue
        </Button>
      </div>
    </div>
  );
}
