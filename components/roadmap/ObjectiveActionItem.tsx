import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapActionItem } from "@/types";

interface ObjectiveActionItemProps {
  item: RoadmapActionItem;
  done?: boolean;
  actions?: React.ReactNode;
}

export function ObjectiveActionItem({
  item,
  done = false,
  actions,
}: ObjectiveActionItemProps) {
  return (
    <li className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {done && (
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-success"
              aria-hidden
            />
          )}
          <p
            className={cn(
              "text-sm font-medium",
              done ? "text-text-muted line-through" : "text-text-primary"
            )}
          >
            {item.task}
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs text-text-muted">
          {item.effort}
        </span>
      </div>

      {item.resources.length > 0 && (
        <ul className="space-y-1 pl-3">
          {item.resources.map((resource, rIndex) => (
            <li
              key={rIndex}
              className="flex flex-wrap items-center gap-2 text-xs text-text-muted"
            >
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono uppercase",
                  resource.type === "free"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                )}
              >
                {resource.type}
              </span>
              {resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {resource.name}
                </a>
              ) : (
                <span>{resource.name}</span>
              )}
              <span>· {resource.cost}</span>
            </li>
          ))}
        </ul>
      )}

      {actions}
    </li>
  );
}
