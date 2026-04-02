import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { cx } from "@/components/ui/classnames";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";
import type {
  CategoryGateSpec,
  ConstraintSlug,
} from "@/content/categoryGates/types";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Start with the constraint most likely to break a tool first, then move into the right category filter.",
  alternates: {
    canonical: absoluteUrl("/tools"),
  },
};

type ToolsIndexPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

type ConstraintCard = {
  slug: ConstraintSlug;
  title: string;
  explanation: string;
  examples: string;
};

type CategorySummary = {
  categoryLabel: string;
  categorySlug: string;
  items: CategoryGateSpec[];
};

const PRIMARY_CONSTRAINTS: ConstraintCard[] = [
  {
    slug: "setup-tolerance",
    title: "Publish fast",
    explanation:
      "Start here if setup is the thing most likely to stop you before the tool is even live.",
    examples:
      "If you need a working link today, do not want to configure a system first, or just need to get moving.",
  },
  {
    slug: "maintenance-load",
    title: "Works without upkeep",
    explanation:
      "Start here if the wrong tool becomes another thing you have to maintain.",
    examples:
      "If you want it to keep working, avoid cleanup work, or do not want to babysit settings later.",
  },
  {
    slug: "feature-aversion",
    title: "Keeps it simple",
    explanation:
      "Start here if too many layers, options, or extra systems will get in your way.",
    examples:
      "If you want fewer moving parts, less interface weight, or a tool that stays focused on the basic job.",
  },
  {
    slug: "ceiling-check",
    title: "Doesn't cap you",
    explanation:
      "Start here if the real risk is outgrowing the tool once your workflow gets heavier.",
    examples:
      "If you expect more automation, more control, or a higher ceiling to matter soon.",
  },
  {
    slug: "time-scarcity",
    title: "Fast to use daily",
    explanation:
      "Start here if repeated use needs to stay quick and low-effort.",
    examples:
      "If you are busy, tired, context-switching all day, or need routine actions to stay short.",
  },
  {
    slug: "fear-of-breaking",
    title: "Hard to break",
    explanation:
      "Start here if a fragile setup or easy misconfiguration will make you avoid the tool.",
    examples:
      "If you are worried about breaking something, choosing the wrong setting, or dealing with brittle defaults.",
  },
  {
    slug: "switching-cost",
    title: "Easy to switch",
    explanation:
      "Start here if you may only need the tool for a while and do not want commitment to be the trap.",
    examples:
      "If this is for school, a short project, a trial run, or a workflow you may replace soon.",
  },
];

function humanConstraintLabel(slug: ConstraintSlug) {
  switch (slug) {
    case "setup-tolerance":
      return "Publish fast";
    case "maintenance-load":
      return "Works without upkeep";
    case "switching-cost":
      return "Easy to switch";
    case "time-scarcity":
      return "Fast to use daily";
    case "ceiling-check":
      return "Doesn't cap you";
    case "fear-of-breaking":
      return "Hard to break";
    case "feature-aversion":
      return "Keeps it simple";
    default:
      return slug;
  }
}

function groupCategories(gates: CategoryGateSpec[]) {
  const byCategory = new Map<string, CategoryGateSpec[]>();

  for (const gate of gates) {
    const key = gate.categoryLabel;
    const inCategory = byCategory.get(key) ?? [];
    inCategory.push(gate);
    byCategory.set(key, inCategory);
  }

  return Array.from(byCategory.entries())
    .map(([categoryLabel, items]) => ({
      categoryLabel,
      categorySlug: items[0].categorySlug,
      items: [...items].sort((a, b) =>
        humanConstraintLabel(a.constraintSlug).localeCompare(
          humanConstraintLabel(b.constraintSlug)
        )
      ),
    }))
    .sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));
}

function getConstraintTarget(
  categories: CategorySummary[],
  selectedCategory: CategorySummary,
  constraintSlug: ConstraintSlug
) {
  const selectedMatch = selectedCategory.items.find(
    (gate) => gate.constraintSlug === constraintSlug
  );

  if (selectedMatch) {
    return {
      href: `/tools/${selectedMatch.categorySlug}/${selectedMatch.constraintSlug}`,
      action: `Open ${selectedCategory.categoryLabel}`,
      detail: "Published gate",
    };
  }

  const fallbackMatch = categories
    .flatMap((category) => category.items)
    .find((gate) => gate.constraintSlug === constraintSlug);

  if (fallbackMatch) {
    return {
      href: `/tools/${fallbackMatch.categorySlug}/${fallbackMatch.constraintSlug}`,
      action: `Open ${fallbackMatch.categoryLabel}`,
      detail: "Published gate",
    };
  }

  return {
    href: `/tools/${selectedCategory.categorySlug}`,
    action: `Start in ${selectedCategory.categoryLabel}`,
    detail: "Category fallback",
  };
}

function getCategoryBreakCopy(categoryLabel: string) {
  const normalized = categoryLabel.toLowerCase();

  if (normalized.includes("calendar") || normalized.includes("scheduling")) {
    return "What breaks first here is usually how long it takes to get from setup to a working booking link.";
  }

  if (normalized.includes("task")) {
    return "What breaks first here is usually workflow drag, upkeep, or too much structure too early.";
  }

  if (normalized.includes("note")) {
    return "What breaks first here is usually complexity, friction in capture, or a ceiling that shows up later.";
  }

  return "What breaks first here is usually the friction that shows up before the tool becomes reliably useful.";
}

function getCategoryStartHere(category: CategorySummary) {
  const preferredOrder: ConstraintSlug[] = [
    "setup-tolerance",
    "maintenance-load",
    "feature-aversion",
    "time-scarcity",
    "ceiling-check",
    "fear-of-breaking",
    "switching-cost",
  ];

  const firstGate = preferredOrder
    .map((slug) => category.items.find((gate) => gate.constraintSlug === slug))
    .find(Boolean);

  if (!firstGate) return null;

  return {
    href: `/tools/${firstGate.categorySlug}/${firstGate.constraintSlug}`,
    label: humanConstraintLabel(firstGate.constraintSlug),
  };
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
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Orientation" />
        <p className="max-w-3xl text-sm leading-6 text-black/70">
          Start with what usually breaks first for you. Pick the constraint that
          matters most, then move into the category where you need a tool.
        </p>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading
          title="Start With What Breaks First"
          subtitle={`Current category focus: ${selectedCategory.categoryLabel}. Change category below if you already know where you need the tool.`}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PRIMARY_CONSTRAINTS.map((constraint) => {
            const target = getConstraintTarget(
              categories,
              selectedCategory,
              constraint.slug
            );

            return (
              <Link
                key={constraint.slug}
                href={target.href}
                className={cx(
                  "group rounded-2xl border border-black/10 bg-black/[0.02] p-5 transition-all",
                  "hover:-translate-y-0.5 hover:border-black/20 hover:bg-black/[0.04]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                )}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-base font-semibold tracking-tight text-black">
                      {constraint.title}
                    </p>
                    <p className="text-sm leading-6 text-black/70">
                      {constraint.explanation}
                    </p>
                  </div>

                  <p className="text-sm leading-6 text-black/60">
                    <span className="font-medium text-black/75">Plain language:</span>{" "}
                    {constraint.examples}
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-black">
                      {target.action}
                    </span>
                    <span className="text-xs uppercase tracking-[0.14em] text-black/45">
                      {target.detail}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading
          title="Pick a Category"
          subtitle="If you already know the category, go here. Categories stay secondary to the constraint cards above."
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const startHere = getCategoryStartHere(category);

            return (
              <Card key={category.categorySlug} className="space-y-4 border-black/15">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight text-black">
                    {category.categoryLabel}
                  </h3>
                  <p className="text-sm leading-6 text-black/70">
                    {getCategoryBreakCopy(category.categoryLabel)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Link
                    href={`/tools/${category.categorySlug}`}
                    className="font-medium text-black/80 hover:text-black hover:underline"
                  >
                    Open category
                  </Link>
                  {startHere ? (
                    <Link
                      href={startHere.href}
                      className="text-black/60 hover:text-black hover:underline"
                    >
                      Start here: {startHere.label}
                    </Link>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="How This Works" />
        <div className="max-w-3xl space-y-3 text-sm leading-6 text-black/70">
          <p>
            Tools are filtered by what fails first under your constraint, not by
            who lists more features.
          </p>
          <p>
            Each path is trying to remove the option most likely to create
            friction before it pays off.
          </p>
          <p>
            The right tool is the one that still holds up after your main
            constraint is applied.
          </p>
        </div>
      </section>
    </main>
  );
}
