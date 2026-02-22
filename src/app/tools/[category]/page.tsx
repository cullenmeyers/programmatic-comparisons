import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";

type Params = { category: string };

function cleanTitle(value: string) {
  return value.replace(/^Quick (Gate|Filter):\s*/i, "").trim();
}

function getCategoryGates(category: string) {
  return listAllCategoryGates()
    .filter((gate) => gate.categorySlug === category)
    .sort((a, b) => a.embedBlockTitle.localeCompare(b.embedBlockTitle));
}

export async function generateStaticParams() {
  const categories = Array.from(
    new Set(listAllCategoryGates().map((gate) => gate.categorySlug))
  ).sort((a, b) => a.localeCompare(b));
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const gates = getCategoryGates(category);
  if (!gates.length) return { title: "Category not found" };

  return {
    title: `${gates[0].categoryLabel} | Tools | Decision Clarities`,
    description: `Quick filters for ${gates[0].categoryLabel}.`,
  };
}

export default async function ToolsCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const gates = getCategoryGates(category);
  if (!gates.length) return notFound();

  const categoryLabel = gates[0].categoryLabel;

  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-3xl space-y-4">
        <ButtonLink href="/tools" variant="ghost" className="px-0 py-0">
          All tool filters
        </ButtonLink>
        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          {categoryLabel}
        </h1>
        <p className="text-black/70">
          Pick the filter that matches your situation, then check one tool or
          compare two tools directly.
        </p>
        <div className="flex flex-wrap gap-2">
          {gates.map((gate) => (
            <PillLink
              key={`${gate.categorySlug}-${gate.constraintSlug}`}
              href={`/tools/${gate.categorySlug}/${gate.constraintSlug}`}
            >
              {gate.uiConstraintName ?? gate.constraintLabel}
            </PillLink>
          ))}
        </div>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="Available filters" />
        <div className="grid gap-4 sm:grid-cols-2">
          {gates.map((gate) => (
            <Card key={`${gate.categorySlug}-${gate.constraintSlug}`} className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-black/55">Quick filter</p>
              <h2 className="text-lg font-semibold tracking-tight text-black">
                {cleanTitle(gate.embedBlockTitle)}
              </h2>
              <p className="text-sm text-black/65">
                Focus:{" "}
                <span className="font-medium text-black/75">
                  {gate.uiConstraintName ?? gate.constraintLabel}
                </span>
              </p>
              <p className="text-sm text-black/70">
                {gate.description[0] || "Open this filter to narrow options quickly."}
              </p>
              <Link
                href={`/tools/${gate.categorySlug}/${gate.constraintSlug}`}
                className="text-sm text-black/80 hover:text-black hover:underline"
              >
                Open filter
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
