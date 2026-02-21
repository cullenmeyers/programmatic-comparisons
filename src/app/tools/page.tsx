// src/app/tools/page.tsx

import Link from "next/link";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";

export const metadata = {
  title: "Tools | Decision Clarities",
  description:
    "Quick filters that eliminate the wrong option fast — by category and what you care about (setup, upkeep, simplicity, etc.).",
};

function cleanTitle(s: string) {
  return s.replace(/^Quick Gate:\s*/i, "").trim();
}

export default function ToolsIndexPage() {
  const gates = listAllCategoryGates();

  // group by categoryLabel
  const byCategory = new Map<string, typeof gates>();
  for (const g of gates) {
    const key = g.categoryLabel;
    const arr = byCategory.get(key) ?? [];
    arr.push(g);
    byCategory.set(key, arr);
  }

  const categories = Array.from(byCategory.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
        <p className="text-black/70 leading-7">
          Quick filters that tell you which option is likely to become a problem{" "}
          <span className="font-medium text-black/80">first</span>.
        </p>

        <Link
          className="inline-block text-sm underline underline-offset-4 text-black/75 hover:text-black"
          href="/compare"
        >
          Browse comparisons →
        </Link>
      </header>

      <div className="space-y-8">
        {categories.map(([categoryLabel, items]) => {
          const sorted = [...items].sort((a, b) =>
            a.embedBlockTitle.localeCompare(b.embedBlockTitle)
          );

          return (
            <section
              key={categoryLabel}
              className="rounded-2xl border border-black/10 bg-white p-6 space-y-4"
            >
              <div className="text-xs uppercase tracking-wide text-black/55">
                Category
              </div>

              <div className="text-xl font-semibold tracking-tight">
                {categoryLabel}
              </div>

              <div className="space-y-3">
                {sorted.map((g) => (
                  <div
                    key={`${g.categorySlug}__${g.constraintSlug}`}
                    className="rounded-xl border border-black/10 bg-black/[0.02] p-4"
                  >
                    <div className="text-xs uppercase tracking-wide text-black/55">
                      Quick filter
                    </div>

                    <div className="mt-1 text-sm font-semibold text-black/90">
                      {cleanTitle(g.embedBlockTitle)}
                    </div>

                    <div className="mt-1 text-xs text-black/60">
                      Filter:{" "}
                      <span className="font-medium text-black/75">
                        {g.constraintLabel}
                      </span>
                    </div>

                    <Link
                      className="mt-2 inline-block text-sm underline underline-offset-4 text-black/75 hover:text-black"
                      href={`/tools/${g.categorySlug}/${g.constraintSlug}`}
                    >
                      Open →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}