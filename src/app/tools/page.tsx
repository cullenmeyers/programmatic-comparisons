import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { cx } from "@/components/ui/classnames";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";
import type { CategoryGateSpec } from "@/content/categoryGates/types";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Choose a tool category, then use the right gate to eliminate the option most likely to fail first.",
  alternates: {
    canonical: absoluteUrl("/tools"),
  },
};

type ToolsIndexPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

function normalizeGateLabel(gate: CategoryGateSpec) {
  switch (gate.constraintSlug) {
    case "setup-tolerance":
      return "Easy to start";
    case "maintenance-load":
      return "Works without upkeep";
    case "switching-cost":
      return "Easy to quit later";
    case "time-scarcity":
      return "Fast to use daily";
    case "ceiling-check":
      return "Grows with you";
    case "fear-of-breaking":
      return "Hard to mess up";
    case "feature-aversion":
      return "Keeps it simple";
    default:
      return gate.uiConstraintName ?? cleanTitle(gate.embedBlockTitle);
  }
}

function gateUseCase(gate: CategoryGateSpec) {
  switch (gate.constraintSlug) {
    case "setup-tolerance":
      return "Use this when setup friction is the main thing you want to avoid.";
    case "maintenance-load":
      return "Use this when you want something that keeps working without extra care.";
    case "switching-cost":
      return "Use this when you may want to stop or switch without much pain later.";
    case "time-scarcity":
      return "Use this when daily speed matters more than feature depth.";
    case "ceiling-check":
      return "Use this when you want a tool that can keep up as your needs grow.";
    case "fear-of-breaking":
      return "Use this when you want a tool that feels safe and hard to misconfigure.";
    case "feature-aversion":
      return "Use this when you want a tool that stays simple.";
    default:
      return "Use this when you want to remove the option most likely to become a problem first.";
  }
}

function pickCategorySummary(categoryLabel: string) {
  const normalized = categoryLabel.toLowerCase();

  if (normalized.includes("task")) {
    return "Pick the task-management friction you want to avoid first, then open the matching gate.";
  }

  if (normalized.includes("note")) {
    return "Start with the note-taking failure mode you care about most, then narrow from there.";
  }

  if (normalized.includes("calendar") || normalized.includes("scheduling")) {
    return "Choose the scheduling bottleneck you want to avoid first, then open that gate.";
  }

  return "Choose the kind of friction most likely to make the wrong tool fail for you first.";
}

function cleanTitle(value: string) {
  return value.replace(/^Quick (Gate|Filter):\s*/i, "").trim();
}

export default async function ToolsIndexPage({
  searchParams,
}: ToolsIndexPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const gates = listAllCategoryGates();

  const byCategory = new Map<string, CategoryGateSpec[]>();
  for (const gate of gates) {
    const key = gate.categoryLabel;
    const inCategory = byCategory.get(key) ?? [];
    inCategory.push(gate);
    byCategory.set(key, inCategory);
  }

  const categories = Array.from(byCategory.entries())
    .map(([categoryLabel, items]) => ({
      categoryLabel,
      categorySlug: items[0].categorySlug,
      items: [...items].sort((a, b) =>
        normalizeGateLabel(a).localeCompare(normalizeGateLabel(b))
      ),
    }))
    .sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));

  const selectedCategory =
    categories.find(
      (category) => category.categorySlug === resolvedSearchParams?.category
    ) ?? categories[0];

  if (!selectedCategory) {
    return (
      <main className="site-container page-shell content-stack">
        <header className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
            Tools
          </h1>
          <p className="max-w-2xl leading-7 text-black/70">
            No tool gates are available yet.
          </p>
        </header>
      </main>
    );
  }

  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Tools
        </h1>
        <p className="max-w-2xl leading-7 text-black/70">
          Pick a category, then pick the kind of friction or bottleneck you care
          about most. Each gate helps you eliminate the tool most likely to fail
          first.
        </p>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading
          title="Pick your category"
          subtitle="Choose a category to see the available gates for that type of tool."
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = category.categorySlug === selectedCategory.categorySlug;

            return (
              <Link
                key={category.categorySlug}
                href={`/tools?category=${category.categorySlug}`}
                className={cx(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                  isSelected
                    ? "border-black/30 bg-black text-white"
                    : "border-black/15 text-black/80 hover:bg-black hover:text-white"
                )}
                aria-current={isSelected ? "page" : undefined}
              >
                {category.categoryLabel}
              </Link>
            );
          })}
        </div>
      </section>

      <Card className="space-y-6 border-black/15 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-black px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                {selectedCategory.items.length} gates
              </span>
              <span className="rounded-full border border-black/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/55">
                Selected category
              </span>
            </div>
            <SectionHeading
              title={selectedCategory.categoryLabel}
              subtitle={pickCategorySummary(selectedCategory.categoryLabel)}
            />
          </div>
          <Link
            href={`/tools/${selectedCategory.categorySlug}`}
            className="text-sm font-medium text-black/75 hover:text-black hover:underline"
          >
            View category hub
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {selectedCategory.items.map((gate) => (
            <Link
              key={`${gate.categorySlug}__${gate.constraintSlug}`}
              href={`/tools/${gate.categorySlug}/${gate.constraintSlug}`}
              className={cx(
                "group rounded-2xl border border-black/10 bg-black/[0.02] p-5 transition-all",
                "hover:-translate-y-0.5 hover:border-black/20 hover:bg-black/[0.04]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
              )}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-base font-semibold tracking-tight text-black">
                    {normalizeGateLabel(gate)}
                  </p>
                  <p className="text-sm leading-6 text-black/65">
                    {gateUseCase(gate)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-black">Open gate</span>
                  <span className="text-xs text-black/45">
                    {cleanTitle(gate.embedBlockTitle)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </main>
  );
}
