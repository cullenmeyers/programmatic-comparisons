import type { Metadata } from "next";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { getComparisonDisplayTitle, loadPageBySlug } from "@/lib/pages";
import { absoluteUrl } from "@/lib/site";

type EvidenceItem = {
  slug: string;
  whatFailsFirst: string;
  whatHeldUpBetter: string;
};

const metaDescription =
  "Choose a task manager that still works when you want to start immediately. See what fails first when setup gets in the way of adding a task.";

export const metadata: Metadata = {
  title: "Task Managers for People Who Hate Setup | ToolPicker",
  description: metaDescription,
  alternates: {
    canonical: absoluteUrl("/task-managers/for-people-who-hate-setup"),
  },
};

const pageData = {
  evidence: [
    {
      slug: "notion-vs-todoist-for-beginner",
      whatFailsFirst: "Notion asks the beginner to create pages, databases, or layout before the first task feels settled.",
      whatHeldUpBetter: "Todoist held up better by letting the list come first and the structure stay optional.",
    },
    {
      slug: "clickup-vs-microsoft-to-do-for-beginner",
      whatFailsFirst: "ClickUp puts spaces, folders, and project planning in front of a plain checklist.",
      whatHeldUpBetter: "Microsoft To Do held up better because you can open a list and start typing right away.",
    },
  ] satisfies EvidenceItem[],
} as const;

function getEvidenceLinks(items: readonly EvidenceItem[]) {
  return items.map((item) => {
    const page = loadPageBySlug(item.slug);

    if (!page) {
      throw new Error(
        `Expected comparison page "${item.slug}" to exist for the setup-friction proof page.`
      );
    }

    return {
      ...item,
      title: getComparisonDisplayTitle(page.title),
    };
  });
}

export default function TaskManagersForPeopleWhoHateSetupPage() {
  const evidenceLinks = getEvidenceLinks(pageData.evidence);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/task-managers" variant="ghost" className="px-0 py-0">
          Task Managers
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Task Managers for People Who Hate Setup
        </h1>
        <p className="max-w-2xl text-base leading-7 text-black/70">
          Choose a task manager that still works when you want to start immediately.
        </p>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-second verdict" />
        <Card className="space-y-3 border-black/15 bg-black/[0.03]">
          <p className="text-base leading-7 text-black/85">
            If setup usually kills the habit, start with task managers that let you
            add a task immediately.
          </p>
          <p className="text-sm leading-6 text-black/65">
            Be careful with tools that ask for projects, views, statuses, or
            workspace structure before the first task is safely recorded.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Tools that usually fit this constraint" />
        <Card className="space-y-5">
          <p className="text-sm leading-6 text-black/65">
            These are conditional signals: the tool changes when the failure trigger
            changes.
          </p>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Tools that survive when capture comes first
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>
                <span className="font-medium text-black">Todoist:</span> Todoist
                survives this constraint when quick capture matters more than
                building a task system first.
              </li>
              <li>
                <span className="font-medium text-black">Microsoft To Do:</span>{" "}
                Microsoft To Do survives this constraint when a plain checklist is
                enough to start.
              </li>
              <li>
                <span className="font-medium text-black">Apple Reminders:</span>{" "}
                Apple Reminders can fit this constraint when a simple list and quick
                entry matter more than building extra structure first.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Tools that fail first when setup appears before capture
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>
                <span className="font-medium text-black">Notion:</span> Notion fails
                first here when databases, pages, or layout decisions appear before
                the first task is recorded.
              </li>
              <li>
                <span className="font-medium text-black">ClickUp:</span> ClickUp
                fails first here when spaces, folders, views, or workspace routing
                appear before a plain checklist.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">This can flip when</h3>
            <p className="text-sm leading-6 text-black/75">
              Heavier tools can make more sense when you genuinely need team
              workflows, dashboards, automation, reporting, or a more structured
              project system.
            </p>
          </div>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="How setup breaks task managers" />
        <Card className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-black/60">
            What you need -&gt; what the tool makes you do -&gt; where it gets annoying
            -&gt; how it fails -&gt; what still works
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">What you need</p>
              <p className="text-sm leading-6 text-black/80">
                A task manager you can use right away.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                What the tool makes you do
              </p>
              <p className="text-sm leading-6 text-black/80">
                Decide structure before adding the task.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                Where it gets annoying
              </p>
              <p className="text-sm leading-6 text-black/80">
                Projects, views, statuses, and setup choices appear too early.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">How it fails</p>
              <p className="text-sm leading-6 text-black/80">
                You postpone entry, work from memory, or stop using the tool.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                What still works
              </p>
              <p className="text-sm leading-6 text-black/80">
                Add the task first, organize it later.
              </p>
            </Card>
          </div>
          <p className="text-sm leading-6 text-black/65">
            Why setup matters more in task managers: the first job is not advanced
            planning. It is making sure the task gets captured before it disappears.
          </p>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="content-stack gap-4">
          <SectionHeading title="What fails first" />
          <Card className="space-y-3">
            <p className="text-sm leading-6 text-black/80">
              Task managers fail first when adding one task turns into planning the
              system around it.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>You need to choose a project, database, view, or status before entry.</li>
              <li>The tool asks you to organize before it helps you remember.</li>
              <li>Every extra choice increases the chance that capture gets delayed.</li>
            </ul>
            <p className="text-sm leading-6 text-black/65">
              The repeated pattern is simple: once structure shows up before capture,
              the habit breaks before the system has a chance to prove itself.
            </p>
          </Card>
        </section>

        <section className="content-stack gap-4">
          <SectionHeading title="What survives" />
          <Card className="space-y-3">
            <p className="text-sm leading-6 text-black/80">
              The tools that hold up here let you add a task first and organize it
              later.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>They open ready for entry instead of setup.</li>
              <li>Default lists work before you build a system.</li>
              <li>Extra structure can wait until the habit already exists.</li>
            </ul>
            <p className="text-sm leading-6 text-black/65">
              Plain-list tools often last longer here because they help first and ask
              questions later.
            </p>
          </Card>
        </section>
      </div>

      <section className="content-stack gap-4">
        <SectionHeading title="Tradeoff / when this flips" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            This flips when the extra structure is no longer theoretical and is
            actually doing important work.
          </p>
          <p className="text-sm leading-6 text-black/65">
            If you truly need team workflows, dashboards, automation, or richer
            planning, the heavier tool may pay you back later. This page is only
            saying that simpler tools survive longer when setup is the part that keeps
            breaking the habit.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Evidence from existing comparisons" />
        <Card className="space-y-4">
          <p className="text-sm leading-6 text-black/75">
            These examples show the same failure pattern appearing across existing
            ToolPicker comparisons.
          </p>
          <p className="text-sm leading-6 text-black/65">
            This page only uses examples that match the setup-before-capture pattern
            closely.
          </p>
          <ul className="space-y-4 text-sm leading-6">
            {evidenceLinks.map((item) => (
              <li key={item.slug} className="space-y-2">
                <Link
                  href={`/compare/${item.slug}`}
                  className="font-medium text-black underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-black/75">
                  <span className="font-medium text-black">What failed first:</span>{" "}
                  {item.whatFailsFirst}
                </p>
                <p className="text-black/65">
                  <span className="font-medium text-black">What held up better:</span>{" "}
                  {item.whatHeldUpBetter}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Want a more specific answer?" />
        <Card className="space-y-4">
          <p className="text-sm leading-6 text-black/75">
            Use the decision tool if you want the same logic matched to your exact
            situation.
          </p>
          <div>
            <ButtonLink href="/decide" variant="primary">
              Open decision tool
            </ButtonLink>
          </div>
        </Card>
      </section>
    </main>
  );
}
