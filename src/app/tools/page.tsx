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

type EntryCard = {
  slug: ConstraintSlug;
  title: string;
  description: string;
};

type CategorySummary = {
  categoryLabel: string;
  categorySlug: string;
  items: CategoryGateSpec[];
};

const START_HERE_CARDS: EntryCard[] = [
  {
    slug: "feature-aversion",
    title: "Keeps it simple",
    description: "Use this if extra layers and options usually slow you down.",
  },
  {
    slug: "maintenance-load",
    title: "Works without upkeep",
    description: "Use this if you want something that keeps working with less care.",
  },
];

const SECONDARY_CARDS: EntryCard[] = [
  {
    slug: "setup-tolerance",
    title: "Fast to start",
    description: "Use this if setup is the first thing that usually gets in the way.",
  },
  {
    slug: "ceiling-check",
    title: "Doesn't cap you",
    description: "Use this if outgrowing the tool is the main risk.",
  },
];

type EntryCardsSectionProps = {
  title: string;
  cards: EntryCard[];
  categories: CategorySummary[];
  selectedCategory: CategorySummary;
  featured?: boolean;
};

function EntryCardsSection({
  title,
  cards,
  categories,
  selectedCategory,
  featured = false,
}: EntryCardsSectionProps) {
  return (
    <section className="content-stack gap-4">
      <SectionHeading title={title} />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const target = findTarget(categories, selectedCategory, card.slug);

          return (
            <Link
              key={card.slug}
              href={target.href}
              className={cx(
                "group rounded-2xl border p-5 transition-all",
                featured
                  ? "border-black/15 bg-black/[0.03] md:p-6"
                  : "border-black/10 bg-white",
                "hover:-translate-y-0.5 hover:border-black/25 hover:bg-black/[0.05]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
              )}
            >
              <div className="space-y-3">
                <p
                  className={cx(
                    "font-semibold tracking-tight text-black",
                    featured ? "text-lg sm:text-xl" : "text-base"
                  )}
                >
                  {card.title}
                </p>
                <p className="text-sm leading-6 text-black/70">
                  {card.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

type StartHereSectionProps = {
  categories: CategorySummary[];
  selectedCategory: CategorySummary;
};

function StartHereSection({
  categories,
  selectedCategory,
}: StartHereSectionProps) {
  return (
    <div className="content-stack gap-8">
      <EntryCardsSection
        title="Start here"
        cards={START_HERE_CARDS}
        categories={categories}
        selectedCategory={selectedCategory}
        featured
      />
      <EntryCardsSection
        title="Or choose what matters most"
        cards={SECONDARY_CARDS}
        categories={categories}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}

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

function findTarget(
  categories: CategorySummary[],
  selectedCategory: CategorySummary,
  slug: ConstraintSlug
) {
  const selectedMatch = selectedCategory.items.find(
    (gate) => gate.constraintSlug === slug
  );
  if (selectedMatch) {
    return {
      href: `/tools/${selectedMatch.categorySlug}/${selectedMatch.constraintSlug}`,
      cta: "Start here",
    };
  }

  const fallbackMatch = categories
    .flatMap((category) => category.items)
    .find((gate) => gate.constraintSlug === slug);

  if (fallbackMatch) {
    return {
      href: `/tools/${fallbackMatch.categorySlug}/${fallbackMatch.constraintSlug}`,
      cta: "Open path",
    };
  }

  return {
    href: `/tools/${selectedCategory.categorySlug}`,
    cta: "Open category",
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
