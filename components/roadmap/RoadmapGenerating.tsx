"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { consumeSseStream } from "@/lib/utils/sse";
import { getApiError } from "@/lib/utils/api";

interface RoadmapGeneratingProps {
  aspirationId: string;
  aspirationTitle: string;
}

const GENERATION_TIMEOUT_MS = 360_000;

export function RoadmapGenerating({
  aspirationId,
  aspirationTitle,
}: RoadmapGeneratingProps) {
  const router = useRouter();
  const started = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState("Preparing your gap analysis…");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!retrying) return;
    const timer = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [retrying]);

  async function runGeneration() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setPreview("");
    setStatus("Preparing your gap analysis…");
    setElapsedSec(0);
    setRetrying(true);

    let completed = false;
    let failed = false;

    const timeout = setTimeout(() => {
      controller.abort();
      if (!completed) {
        setError(
          "Generation timed out after 6 minutes. Try again — if this keeps happening, shorten your goal timeframe."
        );
        setRetrying(false);
      }
    }, GENERATION_TIMEOUT_MS);

    try {
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aspiration_id: aspirationId }),
        signal: controller.signal,
      });

      if (response.status === 409) {
        const data = (await response.json()) as { roadmap_id?: string };
        if (data.roadmap_id) {
          completed = true;
          router.replace(`/roadmap/baseline/${data.roadmap_id}`);
          return;
        }
      }

      if (!response.ok && response.headers.get("content-type")?.includes("json")) {
        throw new Error(await getApiError(response, "Generation failed"));
      }

      if (!response.ok) {
        throw new Error(`Generation failed (${response.status})`);
      }

      await consumeSseStream(response, {
        onEvent: ({ event, data }) => {
          if (event === "status" && typeof data === "object" && data !== null) {
            const message = (data as { message?: string }).message;
            if (message) setStatus(message);
          }

          if (event === "chunk" && typeof data === "object" && data !== null) {
            const text = (data as { text?: string }).text;
            if (text) {
              setPreview((prev) => {
                const next = prev + text;
                return next.length > 4000 ? next.slice(-4000) : next;
              });
            }
          }

          if (event === "done" && typeof data === "object" && data !== null) {
            const roadmapId = (data as { roadmap_id?: string }).roadmap_id;
            if (roadmapId) {
              completed = true;
              router.replace(`/roadmap/baseline/${roadmapId}`);
            }
          }

          if (event === "error" && typeof data === "object" && data !== null) {
            failed = true;
            const message = (data as { message?: string }).message;
            setError(message ?? "Generation failed");
          }
        },
      });

      if (!completed && !failed) {
        setError(
          "Generation ended unexpectedly before saving. Please try again."
        );
      }
    } catch (err) {
      if (controller.signal.aborted && completed) return;
      if (err instanceof Error && err.name === "AbortError") {
        if (!completed) {
          setError(
            "Generation timed out after 6 minutes. Try again — if this keeps happening, shorten your goal timeframe."
          );
        }
        return;
      }
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      clearTimeout(timeout);
      setRetrying(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void runGeneration();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSlowHint = retrying && elapsedSec >= 45 && !preview;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Generating roadmap
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
          {aspirationTitle}
        </h1>
        <p className="mt-3 text-text-muted">
          Claude is building your gap analysis and milestone plan. This usually
          takes 30–90 seconds.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-3">
          {!error && (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-text-primary">{status}</p>
            {retrying && !error && (
              <p className="mt-1 font-mono text-xs text-text-muted">
                {elapsedSec}s elapsed
              </p>
            )}
          </div>
        </div>

        {showSlowHint && (
          <p className="mt-4 text-sm text-text-muted">
            Still working — complex goals can take up to 2 minutes before text
            appears.
          </p>
        )}

        {preview && !error && (
          <pre className="mt-4 max-h-48 overflow-hidden text-ellipsis whitespace-pre-wrap rounded-lg bg-surface-elevated p-3 font-mono text-[10px] leading-relaxed text-text-muted">
            {preview}
          </pre>
        )}
      </div>

      {error && (
        <div className="space-y-4 rounded-xl border border-warning/40 bg-warning/5 p-6">
          <p className="text-sm text-warning">{error}</p>
          <Button
            type="button"
            onClick={() => void runGeneration()}
            disabled={retrying}
          >
            {retrying ? "Retrying…" : "Try again"}
          </Button>
        </div>
      )}
    </div>
  );
}
