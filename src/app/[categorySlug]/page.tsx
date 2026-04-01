import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  buildCategoryHubPreview,
  getComparisonTitleBySlug,
  getCategoryIndexBySlug,
  isLockedPersona,
  listCategoryIndexes,
  LOCKED_PERSONA_ORDER,
  type PageDoc,
} from "@/lib/pages";
import { absoluteUrl } from "@/lib/site";

type Params = { categorySlug: string };

export const dynamic = "force-static";
export const dynamicParams = true;

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

const START_HERE_PERSONA_PRIORITY: Array<(typeof LOCKED_PERSONA_ORDER)[number]> = [
  "Beginner",
  "Busy professional",
  "Non-technical user",
  "Minimalist",
  "Power user",
  "Student",
  "Solo user",
];

const PERSONA_SHORTCUT_COPY: Record<(typeof LOCKED_PERSONA_ORDER)[number], string> = {
  Beginner: "If you want something easy to start",
  "Solo user": "If you want something that works without upkeep",
  Student: "If you want something easy to quit later",
  "Busy professional": "If you need something fast to use daily",
  "Power user": "If you need something that grows with you",
  "Non-technical user": "If you want something hard to mess up",
  Minimalist: "If you want something simple",
};

const CATEGORY_CHOICE_HINTS: Record<string, string> = {
  "ceiling-check": "How well it keeps up as your needs get more advanced",
  "feature-aversion": "Whether you want fewer moving parts or more built-in help",
  "fear-of-breaking": "How forgiving it feels when you do not want to tinker",
  "maintenance-load": "How much ongoing cleanup or upkeep it asks from you",
  "setup-tolerance": "How much setup work you are willing to do upfront",
  "switching-cost": "How easy it is to move over without rebuilding your whole workflow",
  "time-scarcity": "How quickly it fits into your day once everything is set up",
};

type DecisionPersona = {
  name: string;
  comparisonSlugs: string[];
};

type TopComparison = {
  slug: string;
  failureMechanism: string;
};

const TASK_MANAGER_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    comparisonSlugs: [
      "apple-reminders-vs-omnifocus-for-beginner",
      "notion-vs-todoist-for-beginner",
      "jira-vs-trello-for-beginner",
      "google-tasks-vs-trello-for-beginner",
    ],
  },
  {
    name: "Solo user",
    comparisonSlugs: [
      "microsoft-to-do-vs-notion-for-solo-user",
      "apple-reminders-vs-sunsama-for-solo-user",
      "trello-vs-wekan-for-solo-user",
      "taskboard-vs-trello-for-solo-user",
    ],
  },
  {
    name: "Student",
    comparisonSlugs: [
      "todoist-vs-trello-for-student",
      "apple-reminders-vs-things-3-for-student",
      "sunsama-vs-todoist-for-student",
      "microsoft-planner-vs-trello-for-student",
    ],
  },
  {
    name: "Busy professional",
    comparisonSlugs: [
      "apple-reminders-vs-asana-for-busy-professional",
      "apple-reminders-vs-sunsama-for-busy-professional",
      "clickup-vs-todoist-for-busy-professional",
      "motion-vs-todoist-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    comparisonSlugs: [
      "asana-vs-trello-for-power-user",
      "microsoft-to-do-vs-omnifocus-for-power-user",
      "taskwarrior-vs-todoist-for-power-user",
      "apple-reminders-vs-taskheat-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    comparisonSlugs: [
      "microsoft-planner-vs-microsoft-to-do-for-non-technical-user",
      "apple-reminders-vs-trello-for-non-technical-user",
      "basecamp-vs-microsoft-to-do-for-non-technical-user",
      "remember-the-milk-vs-taskwarrior-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    comparisonSlugs: [
      "any-do-vs-apple-reminders-for-minimalist",
      "apple-reminders-vs-clickup-for-minimalist",
      "apple-reminders-vs-facilethings-for-minimalist",
      "amazing-marvin-vs-todoist-for-minimalist",
    ],
  },
];

const TASK_MANAGER_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "apple-reminders-vs-omnifocus-for-beginner",
    failureMechanism: "Framework overhead before capture.",
  },
  {
    slug: "apple-reminders-vs-sunsama-for-busy-professional",
    failureMechanism: "Daily planning ritual before execution.",
  },
  {
    slug: "microsoft-to-do-vs-notion-for-solo-user",
    failureMechanism: "System redesign and upkeep over time.",
  },
  {
    slug: "todoist-vs-trello-for-student",
    failureMechanism: "Board setup that outlasts the semester.",
  },
  {
    slug: "microsoft-planner-vs-microsoft-to-do-for-non-technical-user",
    failureMechanism: "Structure that feels easy to get wrong.",
  },
  {
    slug: "asana-vs-trello-for-power-user",
    failureMechanism: "Ceiling hit when dependencies matter.",
  },
  {
    slug: "apple-reminders-vs-clickup-for-minimalist",
    failureMechanism: "Feature weight and decision drag.",
  },
];

function renderTaskManagersHub() {
  const personas = TASK_MANAGER_PERSONAS.map((persona) => ({
    ...persona,
    comparisons: persona.comparisonSlugs.map((slug) => ({
      slug,
      title: getComparisonTitleBySlug(slug),
    })),
  }));

  const topComparisons = TASK_MANAGER_TOP_COMPARISONS.map((comparison) => ({
    ...comparison,
    title: getComparisonTitleBySlug(comparison.slug),
  }));

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Task Managers
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Task managers do not fail on features. They fail when setup blocks
            capture, when daily use adds friction, when upkeep becomes its own
            job, or when the system caps out under real complexity.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not break first under your
            constraint.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup must disappear -&gt; Apple Reminders</li>
            <li>If daily speed matters more than system depth -&gt; Todoist</li>
            <li>If you want a visual board without process overhead -&gt; Trello</li>
            <li>If strict GTD depth is the constraint -&gt; OmniFocus</li>
            <li>If engineering workflow structure is the constraint -&gt; Jira</li>
            <li>If task dependencies must stay visible -&gt; Taskheat</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <div className="grid gap-4 lg:grid-cols-2">
          {personas.map((persona) => (
            <Card key={persona.name} className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-black">
                {persona.name}
              </h2>
              <div className="space-y-2 text-sm leading-6">
                {persona.comparisons.map((comparison) => (
                  <Link
                    key={comparison.slug}
                    href={`/compare/${comparison.slug}`}
                    className="block text-black/80 underline-offset-4 hover:text-black hover:underline"
                  >
                    {comparison.title}
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Top Comparisons" />
        <div className="grid gap-4">
          {topComparisons.map((comparison) => (
            <Card key={comparison.slug} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/55">
                {comparison.failureMechanism}
              </p>
              <Link
                href={`/compare/${comparison.slug}`}
                className="text-base font-semibold text-black underline-offset-4 hover:underline"
              >
                {comparison.title}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the tool that does not break first under your constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            If setup is the failure point, pick the tool that works before
            configuration. If upkeep is the failure point, pick the tool that
            stays useful without maintenance.
          </p>
          <p className="text-sm leading-6 text-black/80">
            If ceiling is the failure point, pick the tool that still holds when
            work gets more complex.
          </p>
        </Card>
      </section>
    </main>
  );
}

function getPersonaSectionId(persona: (typeof LOCKED_PERSONA_ORDER)[number]) {
  return `persona-${persona.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function buildIntro(categoryLabel: string) {
  return `Browse comparison pages for ${categoryLabel.toLowerCase()}. Each page explains which tool fails first under a specific constraint.`;
}

function getStartHereItems(personas: Array<(typeof LOCKED_PERSONA_ORDER)[number]>) {
  const available = new Set(personas);

  return START_HERE_PERSONA_PRIORITY.filter((persona) => available.has(persona))
    .slice(0, 4)
    .map((persona) => ({
    href: `#${getPersonaSectionId(persona)}`,
    label: PERSONA_JUMP_LABELS[persona],
    copy: PERSONA_SHORTCUT_COPY[persona],
  }));
}

function getHowToChooseItems(pages: PageDoc[]) {
  const items: string[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    const hint = page.constraintSlug
      ? CATEGORY_CHOICE_HINTS[page.constraintSlug]
      : undefined;

    if (hint && !seen.has(hint)) {
      seen.add(hint);
      items.push(hint);
    }

    if (items.length === 4) break;
  }

  if (items.length >= 2) {
    return items;
  }

  return [
    "How simple or flexible you want the tool to feel",
    "How much setup you are willing to do at the start",
    "How easy it is to keep using over time",
  ];
}

function getPopularComparisons(pages: PageDoc[]) {
  return pages.slice(0, 5);
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

  if (categorySlug === "task-managers") {
    return {
      title: "Task Managers",
      description:
        "Decision-first task manager hub organized by what breaks first.",
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

  if (categorySlug === "task-managers") {
    return renderTaskManagersHub();
  }

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
  const startHereItems = getStartHereItems(visiblePersonas);
  const howToChooseItems = getHowToChooseItems(category.pages);
  const popularComparisons = getPopularComparisons(category.pages);

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

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        {startHereItems.length > 0 ? (
          <Card className="space-y-3">
            <SectionHeading
              title="Start here"
              subtitle="Choose the path that sounds most like your situation."
            />
            <div className="space-y-2 text-sm leading-6 text-black/75">
              {startHereItems.map((item) => (
                <p key={item.label}>
                  {item.copy}{" "}
                  <a href={item.href} className="font-medium text-black underline-offset-4 hover:underline">
                    {item.label}
                  </a>
                </p>
              ))}
            </div>
          </Card>
        ) : null}

        <Card className="space-y-3">
          <SectionHeading title="How to choose" />
          <ul className="space-y-2 pl-5 text-sm leading-6 text-black/75 list-disc">
            {howToChooseItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        {popularComparisons.length > 0 ? (
          <Card className="space-y-3">
            <SectionHeading title="Popular comparisons" />
            <div className="space-y-2 text-sm leading-6">
              {popularComparisons.map((page) => (
                <Link
                  key={page.slug}
                  href={`/compare/${page.slug}`}
                  className="block text-black/80 underline-offset-4 hover:text-black hover:underline"
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

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
