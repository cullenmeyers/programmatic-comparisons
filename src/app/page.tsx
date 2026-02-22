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
      { label: "Works without upkeep", href: "/tools/task-managers/maintenance-load" },
    ],
  },
  {
    label: "Note-taking apps",
    href: "/tools/note-taking-apps",
    description: "Choose a notes app that feels safe and obvious.",
    sublinks: [
      { label: "Hard to mess up", href: "/tools/note-taking-apps/fear-of-breaking" },
      { label: "Keeps it simple", href: "/tools/note-taking-apps/feature-aversion" },
      { label: "Easy to quit later", href: "/tools/note-taking-apps/switching-cost" },
    ],
  },
  {
    label: "Calendar & scheduling tools",
    href: "/tools/calendar-scheduling-tools",
    description: "Find the scheduling tool that won’t add friction.",
    sublinks: [
      { label: "Publish fast", href: "/tools/calendar-scheduling-tools/setup-tolerance" },
      { label: "Works without upkeep", href: "/tools/calendar-scheduling-tools/maintenance-load" },
      { label: "Keeps it simple", href: "/tools/calendar-scheduling-tools/feature-aversion" },
    ],
  },
];

const examples: ExampleLink[] = [
  // Swap these for real slugs you already have.
  { label: "Notion vs Apple Notes for beginners", href: "/compare/notion-vs-apple-notes-for-beginner" },
  { label: "Evernote vs Apple Notes for non-technical users", href: "/compare/evernote-vs-apple-notes-for-non-technical-user" },
  { label: "Skedda vs Google Calendar for solo users", href: "/compare/skedda-vs-google-calendar-for-solo-user" },
];

function PillLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50"
    >
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      {/* Hero */}
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Decision Clarities
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-neutral-700">
          Clear tool choices for real people. We compare tools by what breaks first — so you can pick quickly and move on.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/compare"
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Compare two tools
          </Link>

          <Link
            href="/tools"
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Pick a tool (quick gates)
          </Link>
        </div>

        {/* Trust / clarity microcopy */}
        <p className="mt-4 text-sm text-neutral-600">
          No accounts. No dashboards. Just clear picks.
        </p>
      </header>

      {/* How it works (user language, not “constraints/lenses”) */}
      <section className="mt-12">
        <h2 className="text-sm font-semibold text-neutral-900">How to use this site</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="text-sm font-medium text-neutral-900">1) Start with your situation</p>
            <p className="mt-2 text-sm text-neutral-600">
              Beginner? Busy? Hate setup? Pick the path that matches you.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="text-sm font-medium text-neutral-900">2) See what fails first</p>
            <p className="mt-2 text-sm text-neutral-600">
              We focus on the deal-breaker that makes one option fall apart.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="text-sm font-medium text-neutral-900">3) Make a clean pick</p>
            <p className="mt-2 text-sm text-neutral-600">
              You get a clear winner and quick rules you can reuse.
            </p>
          </div>
        </div>
      </section>

      {/* Categories + deep gate links (SEO + UX) */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold text-neutral-900">Popular categories</h2>
          <Link href="/tools" className="text-sm text-neutral-700 underline underline-offset-2 hover:text-neutral-900">
            See all categories
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <div key={c.href} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={c.href} className="text-sm font-semibold text-neutral-900 underline underline-offset-2">
                  {c.label}
                </Link>
              </div>

              <p className="mt-2 text-sm text-neutral-600">{c.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {c.sublinks.map((s) => (
                  <PillLink key={s.href} href={s.href}>
                    {s.label}
                  </PillLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Example comparisons (swap to real slugs you have) */}
      <section className="mt-12">
        <h2 className="text-sm font-semibold text-neutral-900">Popular comparisons</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Prefer a straight head-to-head? Start here.
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          {examples.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="underline underline-offset-2 hover:text-neutral-900">
                {e.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}