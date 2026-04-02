import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";
import { absoluteUrl } from "@/lib/site";

type Params = { category: string };
type GateViewModel = {
  orientation: string[];
  startHere: {
    slug: string;
    reason: string;
    cta: string;
  };
  filterDescriptions: Record<string, string>;
  howFiltersWork: string[];
};

function cleanTitle(value: string) {
  return value.replace(/^Quick (Gate|Filter):\s*/i, "").trim();
}

function getCategoryGates(category: string) {
  return listAllCategoryGates()
    .filter((gate) => gate.categorySlug === category)
    .sort((a, b) => a.embedBlockTitle.localeCompare(b.embedBlockTitle));
}

const CATEGORY_PAGE_COPY: Record<string, GateViewModel> = {
  "bookmark-managers": {
    orientation: [
      "In bookmark managers, things usually break when saving and finding links starts taking more effort than the links are worth.",
      "Start with the filter that checks daily friction first, because that is where this category usually falls apart.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily use is the main failure point here: if saving, sorting, or finding links feels slow, people stop using the tool.",
      cta: "Open the daily-use filter",
    },
    filterDescriptions: {
      "time-scarcity":
        "Checks whether the tool stays quick to save into, scan, and come back to when your attention is already stretched.",
      "ceiling-check":
        "Checks whether the tool still holds up once your bookmark pile gets larger, messier, or more structured.",
    },
    howFiltersWork: [
      "Each filter checks a different way bookmark managers fail.",
      "If a tool breaks under that condition, it gets ruled out first.",
      "What stays on the page are the tools that keep working under the limit you care about most.",
    ],
  },
};

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
  const pageCopy = CATEGORY_PAGE_COPY[category];

  return {
    title: `${gates[0].categoryLabel} | Tools`,
    description:
      pageCopy?.orientation[0] ?? `Quick filters for ${gates[0].categoryLabel}.`,
    alternates: {
      canonical: absoluteUrl(`/tools/${category}`),
    },
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
  const pageCopy = CATEGORY_PAGE_COPY[category];

  if (!pageCopy) {
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
              <Card
                key={`${gate.categorySlug}-${gate.constraintSlug}`}
                className="space-y-3"
              >
                <h2 className="text-lg font-semibold tracking-tight text-black">
                  {cleanTitle(gate.embedBlockTitle)}
                </h2>
                <p className="text-sm text-black/70">
                  {gate.description[0] ||
                    "Open this filter to narrow options quickly."}
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

  const startGate =
    gates.find((gate) => gate.constraintSlug === pageCopy.startHere.slug) ?? gates[0];
  const secondaryGates = gates.filter(
    (gate) => gate.constraintSlug !== startGate.constraintSlug
  );

  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-3xl space-y-4">
        <ButtonLink href="/tools" variant="ghost" className="px-0 py-0">
          All tool filters
        </ButtonLink>
        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          {categoryLabel}
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="Category orientation" />
        <div className="max-w-3xl space-y-2 text-sm leading-6 text-black/70">
          {pageCopy.orientation.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start here" />
        <Card className="space-y-3 border-black/15 bg-black/[0.02]">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            {cleanTitle(startGate.embedBlockTitle)}
          </h2>
          <p className="text-sm text-black/70">{pageCopy.startHere.reason}</p>
          <Link
            href={`/tools/${startGate.categorySlug}/${startGate.constraintSlug}`}
            className="text-sm font-medium text-black/80 hover:text-black hover:underline"
          >
            {pageCopy.startHere.cta}
          </Link>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Other ways to filter" />
        <div className="grid gap-4 sm:grid-cols-2">
          {secondaryGates.map((gate) => (
            <Card
              key={`${gate.categorySlug}-${gate.constraintSlug}`}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold tracking-tight text-black">
                {cleanTitle(gate.embedBlockTitle)}
              </h2>
              <p className="text-sm text-black/70">
                {pageCopy.filterDescriptions[gate.constraintSlug] ??
                  gate.description[0] ??
                  "Open this filter to narrow options quickly."}
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

      <section className="content-stack gap-4">
        <SectionHeading title="How these filters work" />
        <div className="max-w-3xl space-y-2 text-sm leading-6 text-black/70">
          {pageCopy.howFiltersWork.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
