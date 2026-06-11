"use client";

import { useMemo, useState } from "react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RESOURCE_FORMATS, type LibraryResource } from "@/types";

interface ResourceLibraryViewProps {
  resources: LibraryResource[];
}

type CostFilter = "all" | "free" | "paid";

const COST_FILTERS: { value: CostFilter; label: string }[] = [
  { value: "all", label: "All costs" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

function formatLabel(format: (typeof RESOURCE_FORMATS)[number]): string {
  return format.charAt(0).toUpperCase() + format.slice(1);
}

export function ResourceLibraryView({ resources }: ResourceLibraryViewProps) {
  const [query, setQuery] = useState("");
  const [costFilter, setCostFilter] = useState<CostFilter>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  const skillAreas = useMemo(
    () => [...new Set(resources.map((r) => r.skillArea))].sort(),
    [resources]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resources.filter((resource) => {
      if (costFilter !== "all" && resource.type !== costFilter) return false;
      if (skillFilter !== "all" && resource.skillArea !== skillFilter) return false;
      if (formatFilter !== "all" && resource.format !== formatFilter) return false;

      if (!normalizedQuery) return true;

      return (
        resource.name.toLowerCase().includes(normalizedQuery) ||
        resource.skillArea.toLowerCase().includes(normalizedQuery) ||
        resource.sourceAspiration?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [resources, query, costFilter, skillFilter, formatFilter]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Library
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Resource library
        </h1>
        <p className="mt-2 max-w-2xl text-text-muted">
          Resources surfaced across your roadmaps — searchable by skill area,
          cost, and format. A reference shelf, not a course catalog.
        </p>
      </header>

      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
        <p className="text-sm text-text-primary">
          <span className="font-mono text-xs uppercase text-warning">V2 scaffold</span>
          {" — "}
          Showing sample data. Resources will aggregate from your completed
          roadmap milestones once this feature ships.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          type="search"
          placeholder="Search resources, skills, or goals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search resources"
        />

        <div className="space-y-3">
          <FilterRow label="Cost">
            {COST_FILTERS.map((option) => (
              <FilterChip
                key={option.value}
                active={costFilter === option.value}
                onClick={() => setCostFilter(option.value)}
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Skill area">
            <FilterChip
              active={skillFilter === "all"}
              onClick={() => setSkillFilter("all")}
            >
              All skills
            </FilterChip>
            {skillAreas.map((area) => (
              <FilterChip
                key={area}
                active={skillFilter === area}
                onClick={() => setSkillFilter(area)}
              >
                {area}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Format">
            <FilterChip
              active={formatFilter === "all"}
              onClick={() => setFormatFilter("all")}
            >
              All formats
            </FilterChip>
            {RESOURCE_FORMATS.map((format) => (
              <FilterChip
                key={format}
                active={formatFilter === format}
                onClick={() => setFormatFilter(format)}
              >
                {formatLabel(format)}
              </FilterChip>
            ))}
          </FilterRow>
        </div>
      </div>

      <section className="space-y-3">
        <p className="font-mono text-xs text-text-muted">
          {filtered.length} resource{filtered.length === 1 ? "" : "s"}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
            <p className="text-sm text-text-muted">
              No resources match your filters. Try broadening your search.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 font-mono text-xs uppercase text-text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text-primary"
      )}
    >
      {children}
    </button>
  );
}
