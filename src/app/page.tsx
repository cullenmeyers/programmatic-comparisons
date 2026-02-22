import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import Link from "next/link";

type CategoryLink = {
  label: string;
  href: string;
  description: string;
  sublinks: { label: string; href: string }[];
};

type ExampleLink = {
  label: string;
  href: string;
};

const categories: CategoryLink[] = [
  {
    label: "Task managers",
    href: "/tools/task-managers",
    description: "Pick a task app that fits how you actually work.",
    sublinks: [
      { label: "Fast to use daily", href: "/tools/task-managers/time-scarcity" },
      { label: "Keeps it simple", href: "/tools/task-managers/feature-aversion" },
      {
        label: "Works without upkeep",
        href: "/tools/task-managers/maintenance-load",
      },
    ],
  },
  {
    label: "Note-taking apps",
    href: "/tools/note-taking-apps",
    description: "Choose a notes app that feels safe and obvious.",
    sublinks: [
      {
        label: "Hard to mess up",
        href: "/tools/note-taking-apps/fear-of-breaking",
      },
      {
        label: "Keeps it simple",
        href: "/tools/note-taking-apps/feature-aversion",
      },
      {
        label: "Easy to quit later",
        href: "/tools/note-taking-apps/switching-cost",
      },
    ],
  },
  {
    label: "Calendar and scheduling tools",
    href: "/tools/calendar-scheduling-tools",
    description: "Find the scheduling tool that will not add friction.",
    sublinks: [
      {
        label: "Publish fast",
        href: "/tools/calendar-scheduling-tools/setup-tolerance",
      },
      {
        label: "Works without upkeep",
        href: "/tools/calendar-scheduling-tools/maintenance-load",
      },
      {
        label: "Keeps it simple",
        href: "/tools/calendar-scheduling-tools/feature-aversion",
      },
    ],
  },
];

const examples: ExampleLink[] = [
  {
    label: "Notion vs Apple Notes for beginners",
    href: "/compare/notion-vs-apple-notes-for-beginner",
  },
  {
    label: "Evernote vs Apple Notes for non-technical users",
    href: "/compare/evernote-vs-apple-notes-for-non-technical-user",
  },
  {
    label: "Skedda vs Google Calendar for solo users",
    href: "/compare/skedda-vs-google-calendar-for-solo-user",
  },
];

export default function HomePage() {
  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
            Decision Clarities
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-black/70">
            Clear tool choices for real people. We compare tools by what breaks
            first so you can pick quickly and move on.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/compare" variant="primary">
            Compare two tools
          </ButtonLink>
          <ButtonLink href="/tools" variant="secondary">
            Pick a tool with quick filters
          </ButtonLink>
        </div>

        <p className="text-sm text-black/60">
          No accounts. No dashboards. Just clear picks.
        </p>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="How to use this site" />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="space-y-2">
            <p className="text-sm font-medium text-black">1) Start with your situation</p>
            <p className="text-sm text-black/65">
              Beginner? Busy? Hate setup? Pick the path that matches you.
            </p>
          </Card>
          <Card className="space-y-2">
            <p className="text-sm font-medium text-black">2) See what fails first</p>
            <p className="text-sm text-black/65">
              We focus on the deal-breaker that makes one option fall apart.
            </p>
          </Card>
          <Card className="space-y-2">
            <p className="text-sm font-medium text-black">3) Make a clean pick</p>
            <p className="text-sm text-black/65">
              You get a clear winner and quick rules you can reuse.
            </p>
          </Card>
        </div>
      </section>

      <section className="content-stack gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading title="Popular categories" />
          <ButtonLink href="/tools" variant="ghost">
            See all categories
          </ButtonLink>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.href} className="space-y-4">
              <div className="space-y-2">
                <Link href={category.href} className="text-base font-semibold text-black">
                  {category.label}
                </Link>
                <p className="text-sm text-black/65">{category.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.sublinks.map((sublink) => (
                  <PillLink key={sublink.href} href={sublink.href}>
                    {sublink.label}
                  </PillLink>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading
          title="Popular comparisons"
          subtitle="Prefer a straight head-to-head? Start here."
        />
        <Card>
          <ul className="space-y-3 text-sm">
            {examples.map((example) => (
              <li key={example.href}>
                <Link href={example.href} className="text-black/80 hover:text-black">
                  {example.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </main>
  );
}
