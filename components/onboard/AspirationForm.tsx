"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiError, readApiJson } from "@/lib/utils/api";
import { runAsync } from "@/lib/utils/async";
import { cn } from "@/lib/utils";
import {
  ASPIRATION_CATEGORIES,
  type Aspiration,
  type AspirationCategory,
} from "@/types";

interface AspirationFormProps {
  initialAspiration: Aspiration | null;
}

export function AspirationForm({ initialAspiration }: AspirationFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialAspiration?.title ?? "");
  const [description, setDescription] = useState(
    initialAspiration?.description ?? ""
  );
  const [category, setCategory] = useState<AspirationCategory | null>(
    initialAspiration?.category ?? null
  );
  const [targetUrl, setTargetUrl] = useState(
    initialAspiration?.target_url ?? ""
  );
  const [scrapedRequirements, setScrapedRequirements] = useState(
    initialAspiration?.scraped_requirements ?? ""
  );

  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const hasRequiredFields = title.trim().length > 0 && description.trim().length > 0;

  async function persistAspiration() {
    const response = await fetch("/api/aspirations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        target_url: targetUrl,
        scraped_requirements: scrapedRequirements,
      }),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response, "Failed to save aspiration"));
    }

    return readApiJson<{ aspiration_id: string }>(response);
  }

  async function handleExtractRequirements(refresh = false) {
    const url = targetUrl.trim();
    if (!url) {
      setError("Paste a URL first, then extract requirements.");
      return;
    }

    setError(null);
    setSavedMessage(null);
    setScraping(true);

    try {
      const params = new URLSearchParams({ url });
      if (refresh) params.set("refresh", "true");

      const response = await fetch(`/api/scrape?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          await getApiError(response, "Failed to extract requirements")
        );
      }

      const data = await readApiJson<{
        requirements_text: string;
        cached?: boolean;
      }>(response);
      setScrapedRequirements(data.requirements_text);
      setSavedMessage(
        data.cached
          ? "Loaded from shared cache (no AI tokens used). Review and edit before continuing."
          : "Requirements extracted. Review and edit before continuing."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to extract requirements"
      );
    } finally {
      setScraping(false);
    }
  }

  async function handleSaveDraft() {
    if (!hasRequiredFields) {
      setError("Title and description are required to save.");
      return;
    }

    setError(null);
    setSavedMessage(null);
    setSaving(true);

    try {
      await persistAspiration();
      setSavedMessage("Saved. You can come back and refine this anytime.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    if (!hasRequiredFields) {
      setError("Title and description are required to continue.");
      return;
    }

    setError(null);
    setSavedMessage(null);
    setSaving(true);

    try {
      await persistAspiration();
      router.push("/onboard/timeline");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              What you want to achieve
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Be specific. The clearer your goal, the more honest your gap
              analysis and roadmap will be.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Aspiration title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setSavedMessage(null);
              setTitle(e.target.value);
            }}
            disabled={saving}
            placeholder='e.g. "Get into MIT EECS Master&apos;s"'
          />
          <p className="text-xs text-text-muted">
            Short label for your dashboard — you&apos;ll see this every time you
            weigh in.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Aspiration description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => {
              setSavedMessage(null);
              setDescription(e.target.value);
            }}
            disabled={saving}
            placeholder={`What exactly do you want to achieve? Be as specific as possible.

• Link to the program, job posting, or role you're targeting (optional)
• What does success look like? What will you have or be when this is done?`}
            className="min-h-[200px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Category (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {ASPIRATION_CATEGORIES.map((option) => {
              const isSelected = category === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setSavedMessage(null);
                    setCategory(isSelected ? null : option);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/15 text-text-primary"
                      : "border-border bg-surface-elevated text-text-muted hover:border-primary/50 hover:text-text-primary"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Target URL (optional)
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Program page, job posting, or certification requirements — we&apos;ll
              extract key requirements to sharpen your roadmap.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="url"
            value={targetUrl}
            onChange={(e) => {
              setSavedMessage(null);
              setTargetUrl(e.target.value);
            }}
            disabled={saving || scraping}
            placeholder="https://..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              runAsync(() => handleExtractRequirements(false), (err) =>
                setError(
                  err instanceof Error
                    ? err.message
                    : "Failed to extract requirements"
                )
              )
            }
            disabled={saving || scraping || !targetUrl.trim()}
          >
            {scraping ? "Extracting..." : "Extract requirements"}
          </Button>
        </div>

        {(scrapedRequirements || scraping) && (
          <div className="space-y-2 rounded-lg border border-border bg-surface-elevated p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Sparkles className="h-4 w-4 text-primary" />
                Extracted requirements
              </div>
              {scrapedRequirements && !scraping && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-text-muted"
                  onClick={() =>
                    runAsync(() => handleExtractRequirements(true), (err) =>
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Failed to refresh requirements"
                      )
                    )
                  }
                  disabled={saving || !targetUrl.trim()}
                >
                  Re-fetch from URL
                </Button>
              )}
            </div>
            <Textarea
              value={scrapedRequirements}
              onChange={(e) => {
                setSavedMessage(null);
                setScrapedRequirements(e.target.value);
              }}
              disabled={saving || scraping}
              placeholder={
                scraping
                  ? "Reading the page and extracting requirements..."
                  : "Extracted requirements will appear here."
              }
              className="min-h-[160px] font-mono text-xs"
            />
            <p className="text-xs text-text-muted">
              Edit freely — this is included in your gap analysis alongside your
              description.
            </p>
          </div>
        )}
      </section>

      {error && (
        <p className="text-sm text-decline" role="alert">
          {error}
        </p>
      )}
      {savedMessage && (
        <p className="text-sm text-success" role="status">
          {savedMessage}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/onboard/capabilities")}
          disabled={saving || scraping}
        >
          Back
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              runAsync(handleSaveDraft, (err) =>
                setError(err instanceof Error ? err.message : "Failed to save")
              )
            }
            disabled={saving || scraping || !hasRequiredFields}
          >
            Save for later
          </Button>
          <Button
            type="button"
            onClick={() =>
              runAsync(handleSaveAndContinue, (err) =>
                setError(err instanceof Error ? err.message : "Failed to save")
              )
            }
            disabled={saving || scraping || !hasRequiredFields}
          >
            {saving ? "Saving..." : "Save and continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
