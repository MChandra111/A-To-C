"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoadmapResourceGroup } from "@/lib/resources/getResourceLibrary";
import { RESOURCE_FORMATS, type LibraryResource } from "@/types";

interface ResourceLibraryViewProps {
  groups: RoadmapResourceGroup[];
}

type CostFilter = "all" | "free" | "paid";

const COST_FILTERS: { value: CostFilter; label: string }[] = [
  { value: "all", label: "All costs" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

const STATUS_LABELS: Record<RoadmapResourceGroup["aspirationStatus"], string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

function formatLabel(format: (typeof RESOURCE_FORMATS)[number]): string {
  return format.charAt(0).toUpperCase() + format.slice(1);
}

export function ResourceLibraryView({ groups }: ResourceLibraryViewProps) {
  const [selectedRoadmapId, setSelectedRoadmapId] = useState(
    () => groups[0]?.roadmapId ?? ""
  );
  const [query, setQuery] = useState("");
  const [costFilter, setCostFilter] = useState<CostFilter>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  useEffect(() => {
    if (!groups.some((g) => g.roadmapId === selectedRoadmapId)) {
      setSelectedRoadmapId(groups[0]?.roadmapId ?? "");
    }
  }, [groups, selectedRoadmapId]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.roadmapId === selectedRoadmapId) ?? null,
    [groups, selectedRoadmapId]
  );

  const resources = activeGroup?.resources ?? [];

  const skillAreas = useMemo(
    () => [...new Set(resources.map((r) => r.skillArea))].sort(),
    [resources]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resources.filter((resource: LibraryResource) => {
      if (costFilter !== "all" && resource.type !== costFilter) return false;
      if (skillFilter !== "all" && resource.skillArea !== skillFilter) return false;
      if (formatFilter !== "all" && resource.format !== formatFilter) return false;

      if (!normalizedQuery) return true;

      return (
        resource.name.toLowerCase().includes(normalizedQuery) ||
        resource.skillArea.toLowerCase().includes(normalizedQuery) ||
        resource.milestoneLabel?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [resources, query, costFilter, skillFilter, formatFilter]);

  useEffect(() => {
    setSkillFilter("all");
    setFormatFilter("all");
    setQuery("");
  }, [selectedRoadmapId]);

  if (groups.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Library
          </p>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Resource library
          </h1>
        </header>
        <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-sm text-text-muted">
            No roadmaps yet. Generate a roadmap to collect resources here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/onboard/capabilities">Start onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

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
          Resources from each roadmap, grouped by goal. Switch tabs to browse
          what Claude recommended for that aspiration.
        </p>
      </header>

      <div className="space-y-3">
        <p className="font-mono text-xs uppercase text-text-muted">Roadmap</p>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group.roadmapId}
              type="button"
              onClick={() => setSelectedRoadmapId(group.roadmapId)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                selectedRoadmapId === group.roadmapId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text-primary"
              )}
            >
              <span className="font-medium">{group.aspirationTitle}</span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide opacity-80">
                {STATUS_LABELS[group.aspirationStatus]} · {group.resources.length}{" "}
                resources
              </span>
            </button>
          ))}
        </div>

        {activeGroup && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
            {activeGroup.category && <span>{activeGroup.category}</span>}
            <Link
              href={`/roadmap/${activeGroup.roadmapId}`}
              className="text-primary hover:underline"
            >
              View roadmap →
            </Link>
          </div>
        )}
      </div>

      {activeGroup && activeGroup.resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-sm text-text-muted">
            This roadmap has no linked resources in its milestones yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            type="search"
            placeholder="Search within this roadmap…"
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

            {skillAreas.length > 0 && (
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
            )}

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
      )}
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
