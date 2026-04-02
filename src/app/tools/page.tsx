import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import StartHereSection from "@/components/tools/StartHereSection";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";
import type { CategoryGateSpec } from "@/content/categoryGates/types";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Find the right tool",
  description:
    "Start with what matters most, then open the tool path that is least likely to fail first.",
  alternates: {
    canonical: absoluteUrl("/tools"),
  },
};

type ToolsIndexPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

function groupCategories(gates: CategoryGateSpec[]) {
  const byCategory = new Map<string, CategoryGateSpec[]>();

  for (const gate of gates) {
    const inCategory = byCategory.get(gate.categoryLabel) ?? [];
    inCategory.push(gate);
    byCategory.set(gate.categoryLabel, inCategory);
  }

  return Array.from(byCategory.entries())
    .map(([categoryLabel, items]) => ({
      categoryLabel,
      categorySlug: items[0].categorySlug,
      items,
    }))
    .sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));
}

export default async function ToolsIndexPage({
  searchParams,
}: ToolsIndexPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const gates = listAllCategoryGates();
  const categories = groupCategories(gates);

  const selectedCategory =
    categories.find(
      (category) => category.categorySlug === resolvedSearchParams?.category
    ) ?? categories[0];

  if (!selectedCategory) {
    return (
      <main className="site-container page-shell content-stack">
        <header className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
            Find the right tool
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
      <header className="max-w-3xl space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Find the right tool
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-black/70">
          Start with what breaks first for you.
        </p>
      </header>

      <StartHereSection
        categories={categories}
        selectedCategory={selectedCategory}
      />

      <section className="content-stack gap-3">
        <SectionHeading title="Already know the category? Start there." />
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.categorySlug}
              href={`/tools/${category.categorySlug}`}
              className="inline-flex items-center rounded-full border border-black/12 px-3 py-1.5 text-sm text-black/75 transition-colors hover:border-black/20 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            >
              {category.categoryLabel}
            </Link>
          ))}
        </div>
      </section>

      <section className="content-stack gap-3">
        <SectionHeading title="How This Works" />
        <Card className="border-black/10 p-4">
          <p className="text-sm leading-6 text-black/70">
            ToolPicker filters by what fails first. The right tool is the one
            that still holds up under your constraint.
          </p>
        </Card>
      </section>
    </main>
  );
}
