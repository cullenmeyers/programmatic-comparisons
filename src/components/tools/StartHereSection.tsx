import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { cx } from "@/components/ui/classnames";
import type {
  CategoryGateSpec,
  ConstraintSlug,
} from "@/content/categoryGates/types";

type EntryCard = {
  slug: ConstraintSlug;
  title: string;
  description: string;
};

export type CategorySummary = {
  categoryLabel: string;
  categorySlug: string;
  items: CategoryGateSpec[];
};

type StartHereSectionProps = {
  categories: CategorySummary[];
  selectedCategory: CategorySummary;
};

const START_HERE_CARDS: EntryCard[] = [
  {
    slug: "feature-aversion",
    title: "Keeps it simple",
    description: "Choose this if extra layers and options usually slow you down.",
  },
  {
    slug: "maintenance-load",
    title: "Works without upkeep",
    description: "Choose this if you want something that keeps working with less care.",
  },
];

const SECONDARY_CARDS: EntryCard[] = [
  {
    slug: "setup-tolerance",
    title: "Fast to start",
    description: "Choose this if setup is the first thing that usually gets in the way.",
  },
  {
    slug: "ceiling-check",
    title: "Doesn't cap you",
    description: "Choose this if outgrowing the tool is the main risk.",
  },
];

type EntryCardsSectionProps = {
  title: string;
  cards: EntryCard[];
  categories: CategorySummary[];
  selectedCategory: CategorySummary;
  featured?: boolean;
};

function findTarget(
  categories: CategorySummary[],
  selectedCategory: CategorySummary,
  slug: ConstraintSlug
) {
  const selectedMatch = selectedCategory.items.find(
    (gate) => gate.constraintSlug === slug
  );
  if (selectedMatch) {
    return `/tools/${selectedMatch.categorySlug}/${selectedMatch.constraintSlug}`;
  }

  const fallbackMatch = categories
    .flatMap((category) => category.items)
    .find((gate) => gate.constraintSlug === slug);

  if (fallbackMatch) {
    return `/tools/${fallbackMatch.categorySlug}/${fallbackMatch.constraintSlug}`;
  }

  return `/tools/${selectedCategory.categorySlug}`;
}

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
        {cards.map((card) => (
          <Link
            key={card.slug}
            href={findTarget(categories, selectedCategory, card.slug)}
            className={cx(
              "group rounded-2xl border p-5 transition-all",
              featured
                ? "border-black/15 bg-white md:p-6"
                : "border-black/10 bg-black/[0.02]",
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
              <span className="inline-flex text-sm font-medium text-black">
                Open path
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function StartHereSection({
  categories,
  selectedCategory,
}: StartHereSectionProps) {
  return (
    <section className="content-stack gap-8 rounded-[2rem] border border-black/15 bg-black/[0.04] p-6 sm:p-8">
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
    </section>
  );
}
