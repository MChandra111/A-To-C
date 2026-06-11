import { GuruUpsell } from "@/components/plans/GuruUpsell";

export function ResourceLibraryPreview() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Library
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Resource library
        </h1>
      </header>

      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-text-muted">
          A compilation of resources from your roadmaps — courses, books,
          articles, videos, and tools that Claude recommended for each goal,
          gathered in one searchable library. Filter by cost, skill area, and
          format, or jump back to the milestone where each resource was
          suggested.
        </p>

        <GuruUpsell
          title="Resource library is a Guru feature"
          description="Upgrade to browse every free and paid resource across your roadmaps in one place."
        />
      </div>
    </div>
  );
}
