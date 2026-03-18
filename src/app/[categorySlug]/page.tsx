import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  buildCategoryHubPreview,
  getCategoryIndexBySlug,
  isLockedPersona,
  listCategoryIndexes,
  LOCKED_PERSONA_ORDER,
  type PageDoc,
} from "@/lib/pages";
import { absoluteUrl } from "@/lib/site";

type Params = { categorySlug: string };

export const dynamic = "force-static";
export const dynamicParams = false;

const PERSONA_SECTION_TITLES: Record<(typeof LOCKED_PERSONA_ORDER)[number], string> = {
  Beginner: "For Beginners",
  "Solo user": "For Solo users",
  Student: "For Students",
  "Busy professional": "For Busy professionals",
  "Power user": "For Power users",
  "Non-technical user": "For Non-technical users",
  Minimalist: "For Minimalists",
};

const PERSONA_JUMP_LABELS: Record<(typeof LOCKED_PERSONA_ORDER)[number], string> = {
  Beginner: "Beginners",
  "Solo user": "Solo users",
  Student: "Students",
  "Busy professional": "Busy professionals",
  "Power user": "Power users",
  "Non-technical user": "Non-technical users",
  Minimalist: "Minimalists",
};

function getPersonaSectionId(persona: (typeof LOCKED_PERSONA_ORDER)[number]) {
  return `persona-${persona.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function buildIntro(categoryLabel: string) {
  return `Browse comparison pages for ${categoryLabel.toLowerCase()}. Each page explains which tool fails first under a specific constraint.`;
}

export function generateStaticParams() {
  return listCategoryIndexes().map((category) => ({
    categorySlug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = getCategoryIndexBySlug(categorySlug);

  if (!category) {
    return {
      title: "Category Comparisons",
      description: "Persona-grouped tool comparisons by category.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  return {
    title: category.label,
    description: buildIntro(category.label),
    alternates: {
      canonical: absoluteUrl(`/${categorySlug}`),
    },
  };
}

export default async function CategoryIndexPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { categorySlug } = await params;
  const category = getCategoryIndexBySlug(categorySlug);

  if (!category) notFound();

  const groups = new Map<(typeof LOCKED_PERSONA_ORDER)[number], PageDoc[]>();
  for (const persona of LOCKED_PERSONA_ORDER) {
    groups.set(persona, []);
  }

  for (const page of category.pages) {
    if (!isLockedPersona(page.persona)) continue;
    groups.get(page.persona)?.push(page);
  }

  const visiblePersonas = LOCKED_PERSONA_ORDER.filter(
    (persona) => (groups.get(persona)?.length ?? 0) > 0
  );

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          {category.label}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-black/70">
          {buildIntro(category.label)}
        </p>
      </header>

      {visiblePersonas.length === 0 ? (
        <Card>
          <p className="text-black/70">
            No supported persona comparisons are available in this category yet.
          </p>
        </Card>
      ) : (
        <div className="content-stack gap-8">
          <nav aria-label="Jump to persona section" className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-black/55">
              Jump to persona
            </p>
            <div className="flex flex-wrap gap-2">
              {visiblePersonas.map((persona) => (
                <PillLink key={persona} href={`#${getPersonaSectionId(persona)}`}>
                  {PERSONA_JUMP_LABELS[persona]}
                </PillLink>
              ))}
            </div>
          </nav>

          {visiblePersonas.map((persona) => {
            const items = groups.get(persona) ?? [];

            return (
              <section
                key={persona}
                id={getPersonaSectionId(persona)}
                className="content-stack gap-4 scroll-mt-24"
              >
                <SectionHeading
                  title={PERSONA_SECTION_TITLES[persona]}
                  subtitle={`${items.length} ${
                    items.length === 1 ? "comparison" : "comparisons"
                  }`}
                />
                <div className="grid gap-4">
                  {items.map((page) => {
                    const verdictPreview = buildCategoryHubPreview(page);

                    return (
                      <Card key={page.slug} className="space-y-3">
                        <Link
                          href={`/compare/${page.slug}`}
                          className="text-base font-semibold text-black"
                        >
                          {page.title}
                        </Link>
                        {verdictPreview ? (
                          <p className="text-sm leading-6 text-black/75">{verdictPreview}</p>
                        ) : null}
                        <div>
                          <ButtonLink
                            href={`/compare/${page.slug}`}
                            variant="ghost"
                            className="px-0 py-0 text-sm"
                          >
                            Read full comparison
                          </ButtonLink>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
