import type { LibraryResource } from "@/types";
import { cn } from "@/lib/utils";

const FORMAT_LABELS: Record<LibraryResource["format"], string> = {
  course: "Course",
  book: "Book",
  article: "Article",
  video: "Video",
  tool: "Tool",
  certification: "Certification",
};

interface ResourceCardProps {
  resource: LibraryResource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-text-primary hover:text-primary hover:underline"
            >
              {resource.name}
            </a>
          ) : (
            <p className="font-medium text-text-primary">{resource.name}</p>
          )}

          {resource.milestoneLabel && (
            <p className="text-xs text-text-muted">
              {resource.milestoneLabel}
              {resource.mentionCount != null && resource.mentionCount > 1
                ? ` · cited ${resource.mentionCount}× in this roadmap`
                : ""}
            </p>
          )}
        </div>

        <span className="shrink-0 font-mono text-sm text-text-primary">
          {resource.cost}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-xs uppercase",
            resource.type === "free"
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          )}
        >
          {resource.type}
        </span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
          {FORMAT_LABELS[resource.format]}
        </span>
        <span className="rounded border border-border px-1.5 py-0.5 font-mono text-xs text-text-muted">
          {resource.skillArea}
        </span>
      </div>
    </article>
  );
}
