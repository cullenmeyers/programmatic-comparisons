import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { cx } from "@/components/ui/classnames";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Quick filters that eliminate the wrong option fast by category and what you care about.",
  alternates: {
    canonical: absoluteUrl("/tools"),
  },
};

function cleanTitle(value: string) {
  return value.replace(/^Quick Gate:\s*/i, "").trim();
}

function pickCategorySummary(
  categoryLabel: string,
  items: ReturnType<typeof listAllCategoryGates>
) {
  const normalized = categoryLabel.toLowerCase();

  if (normalized.includes("task")) {
    return "Start with the daily friction that usually makes a task system fail.";
  }

  if (normalized.includes("note")) {
    return "Choose based on how safe, simple, and durable your notes need to feel.";
  }

  if (normalized.includes("calendar") || normalized.includes("scheduling")) {
    return "Filter for the scheduling bottleneck that will create the most drag first.";
  }

  const firstDescription = items.flatMap((item) => item.description).find(Boolean);
  return firstDescription ?? "Pick the filter that matches the problem you need to avoid.";
}

export default function ToolsIndexPage() {
  const gates = listAllCategoryGates();

  const byCategory = new Map<string, typeof gates>();
  for (const gate of gates) {
    const key = gate.categoryLabel;
    const inCategory = byCategory.get(key) ?? [];
    inCategory.push(gate);
    byCategory.set(key, inCategory);
  }

  const categories = Array.from(byCategory.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Tools
        </h1>
        <p className="max-w-2xl leading-7 text-black/70">
          Pick the kind of tool you need, then choose the friction that matters
          most. Each filter is built to eliminate the option most likely to
          become a problem first.
        </p>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading
          title="Pick your starting point"
          subtitle="Choose a category, then open the filter that best matches the constraint you care about."
        />
        <div className="flex flex-wrap gap-2">
          {categories.map(([categoryLabel, items]) => (
            <Link
              key={categoryLabel}
              href={`/tools/${items[0].categorySlug}`}
              className="inline-flex items-center rounded-full border border-black/15 px-3 py-1.5 text-sm text-black/80 transition-colors hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            >
              {categoryLabel}
            </Link>
          ))}
        </div>
      </section>

      <div className="content-stack gap-8">
        {categories.map(([categoryLabel, items]) => {
          const sorted = [...items].sort((a, b) =>
            a.embedBlockTitle.localeCompare(b.embedBlockTitle)
          );
          const categoryHref = `/tools/${sorted[0].categorySlug}`;
          const summary = pickCategorySummary(categoryLabel, sorted);

          return (
            <Card key={categoryLabel} className="space-y-6 border-black/15 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-black px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                      {sorted.length} filters
                    </span>
                  </div>
                  <SectionHeading title={categoryLabel} subtitle={summary} />
                </div>
                <Link
                  href={categoryHref}
                  className="text-sm font-medium text-black/75 hover:text-black hover:underline"
                >
                  View category
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sorted.map((gate) => (
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
                          {cleanTitle(gate.embedBlockTitle)}
                        </p>
                        <p className="text-sm leading-6 text-black/65">
                          {gate.description[0] ||
                            "Use this filter to remove the option that is more likely to become painful first."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-black">
                          Explore
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
