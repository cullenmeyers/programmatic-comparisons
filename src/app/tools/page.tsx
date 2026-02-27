import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";

export const metadata = {
  title: "Tools | Decision Clarities",
  description:
    "Quick filters that eliminate the wrong option fast by category and what you care about.",
};

function cleanTitle(value: string) {
  return value.replace(/^Quick Gate:\s*/i, "").trim();
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
          Quick filters that tell you which option is likely to become a problem
          first.
        </p>
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          Browse comparisons
        </ButtonLink>
      </header>

      <div className="content-stack gap-6">
        {categories.map(([categoryLabel, items]) => {
          const sorted = [...items].sort((a, b) =>
            a.embedBlockTitle.localeCompare(b.embedBlockTitle)
          );

          return (
            <Card key={categoryLabel} className="space-y-5">
              <SectionHeading title={categoryLabel} />
              <div className="grid gap-3 sm:grid-cols-2">
                {sorted.map((gate) => (
                  <Card
                    key={`${gate.categorySlug}__${gate.constraintSlug}`}
                    className="space-y-3 bg-black/[0.02] p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-black/55">
                      Quick filter
                    </p>
                    <p className="text-sm font-semibold text-black/90">
                      {cleanTitle(gate.embedBlockTitle)}
                    </p>
                    <Link
                      className="text-sm text-black/80 hover:text-black hover:underline"
                      href={`/tools/${gate.categorySlug}/${gate.constraintSlug}`}
                    >
                      Open filter
                    </Link>
                  </Card>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
