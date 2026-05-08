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
  "Find collaboration tools that keep ownership clear. See what fails first when responsibility gets buried in messages or scattered updates.";

export const metadata: Metadata = {
  title: "Team Collaboration Tools for Clear Ownership | ToolPicker",
  description: metaDescription,
  alternates: {
    canonical: absoluteUrl("/team-collaboration-tools/for-clear-ownership"),
  },
};

const pageData = {
  evidence: [
    {
      slug: "basecamp-vs-slack-for-busy-professional",
      whatFailsFirst:
        "Slack fails first when structured check-ins give way to continuous chat and the team has to keep monitoring messages to understand what still needs an owner.",
      whatHeldUpBetter:
        "Basecamp held up better by keeping discussion inside organized project spaces where responsibility and follow-through are easier to review later.",
    },
    {
      slug: "basecamp-vs-google-chat-for-minimalist",
      whatFailsFirst:
        "Google Chat fails first when messages exist as standalone threads and people have to reconnect each conversation to the work it belongs to.",
      whatHeldUpBetter:
        "Basecamp held up better by anchoring communication to projects and tasks so context does not have to be rebuilt from chat history.",
    },
    {
      slug: "front-vs-gmail-for-busy-professional",
      whatFailsFirst:
        "Gmail fails first when several teammates need to own, discuss, and reply to the same thread without assignment and internal notes living inside the work itself.",
      whatHeldUpBetter:
        "Front held up better by keeping shared ownership, internal context, and the next reply path visible in one thread.",
    },
    {
      slug: "asana-vs-trello-for-power-user",
      whatFailsFirst:
        "Trello fails first when task order and dependency relationships have to be remembered mentally instead of staying visible in the system.",
      whatHeldUpBetter:
        "Asana held up better by keeping task relationships visible so ownership and next action do not depend on manual reconstruction.",
    },
    {
      slug: "linear-vs-trello-for-power-user",
      whatFailsFirst:
        "Trello fails first when a team needs consistent issue states and repeatable workflow structure instead of loose cards that can move without enough shared meaning.",
      whatHeldUpBetter:
        "Linear held up better by attaching ownership and state to structured issues that keep execution clearer across the team.",
    },
  ] satisfies EvidenceItem[],
} as const;

function getEvidenceLinks(items: readonly EvidenceItem[]) {
  return items.map((item) => {
    const page = loadPageBySlug(item.slug);

    if (!page) {
      throw new Error(
        `Expected comparison page "${item.slug}" to exist for the clear-ownership proof page.`
      );
    }

    return {
      ...item,
      title: getComparisonDisplayTitle(page.title),
    };
  });
}

export default function TeamCollaborationToolsForClearOwnershipPage() {
  const evidenceLinks = getEvidenceLinks(pageData.evidence);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink
          href="/team-collaboration-tools"
          variant="ghost"
          className="px-0 py-0"
        >
          Team Collaboration Tools
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Team Collaboration Tools for Clear Ownership
        </h1>
        <p className="max-w-2xl text-base leading-7 text-black/70">
          Choose a collaboration tool that still works when everyone needs to know
          who owns what.
        </p>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-second verdict" />
        <Card className="space-y-3 border-black/15 bg-black/[0.03]">
          <p className="text-base leading-7 text-black/85">
            If ownership clarity is the constraint, prefer tools that keep
            responsibility, context, and next action visible.
          </p>
          <p className="text-sm leading-6 text-black/65">
            Be careful with tools where people have to reconstruct who owns the
            work from scattered messages, comments, or status updates.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Tools that usually fit this constraint" />
        <Card className="space-y-5">
          <p className="text-sm leading-6 text-black/65">
            These are conditional signals: the tool changes when the failure
            trigger changes.
          </p>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Tools that survive when ownership must stay visible
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>
                <span className="font-medium text-black">Asana:</span> Asana
                survives this constraint when task relationships, assignees, and
                next steps need to stay visible across coordinated work.
              </li>
              <li>
                <span className="font-medium text-black">Basecamp:</span>{" "}
                Basecamp survives this constraint when the team needs conversation
                to stay anchored to projects and work objects instead of floating in
                standalone chat.
              </li>
              <li>
                <span className="font-medium text-black">Front:</span> Front
                survives this constraint when several people need one shared thread
                with explicit assignment and internal context.
              </li>
              <li>
                <span className="font-medium text-black">Linear:</span> Linear
                survives this constraint when ownership and state have to stay
                attached to structured issues instead of loose discussion.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Tools that fail first when responsibility has to be reconstructed
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>
                <span className="font-medium text-black">Slack:</span> Slack fails
                first here when ownership lives in active channels and people have
                to watch chat to infer who is taking the next step.
              </li>
              <li>
                <span className="font-medium text-black">Gmail:</span> Gmail fails
                first here when several teammates need to coordinate on one thread
                and assignment leaks into forwarding, labels, or side chat.
              </li>
              <li>
                <span className="font-medium text-black">Google Chat:</span> Google
                Chat fails first here when conversation becomes a set of standalone
                threads that must be manually reconnected to the work.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">This can flip when</h3>
            <p className="text-sm leading-6 text-black/75">
              Discussion-first tools can work when ownership is already obvious
              outside the tool, for example when one person owns the whole project,
              roles do not overlap, or the conversation itself is the work. They
              fail when the team later needs the tool to preserve responsibility
              after the conversation moves on.
            </p>
          </div>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="How ownership breaks team collaboration tools" />
        <Card className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-black/60">
            What you need -&gt; what the tool makes you do -&gt; where it gets
            annoying -&gt; how it fails -&gt; what still works
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                What you need
              </p>
              <p className="text-sm leading-6 text-black/80">
                Clear ownership of work, decisions, and next actions.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                What the tool makes you do
              </p>
              <p className="text-sm leading-6 text-black/80">
                Infer responsibility from messages, comments, mentions, or scattered
                updates.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                Where it gets annoying
              </p>
              <p className="text-sm leading-6 text-black/80">
                Work moves across threads, channels, projects, or people.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                How it fails
              </p>
              <p className="text-sm leading-6 text-black/80">
                Responsibility becomes unclear, duplicated, or dropped.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                What still works
              </p>
              <p className="text-sm leading-6 text-black/80">
                Tools that keep assignment, context, and next step visible.
              </p>
            </Card>
          </div>
          <p className="text-sm leading-6 text-black/65">
            Ownership clarity breaks down when the team can still talk, but can no
            longer see who is responsible without replaying the conversation.
          </p>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="content-stack gap-4">
          <SectionHeading title="What fails first" />
          <Card className="space-y-3">
            <p className="text-sm leading-6 text-black/80">
              Collaboration tools fail when the responsibility model lives beside
              the work instead of on the work.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>Ownership lives in messages instead of visible work objects.</li>
              <li>Assignments are implied instead of explicit.</li>
              <li>Context is spread across channels, threads, comments, or docs.</li>
              <li>Teams must reconstruct responsibility before acting.</li>
            </ul>
            <p className="text-sm leading-6 text-black/65">
              The pattern is durable: once the next step has to be inferred instead
              of seen, coordination slows down and dropped work becomes more likely.
            </p>
          </Card>
        </section>

        <section className="content-stack gap-4">
          <SectionHeading title="What survives" />
          <Card className="space-y-3">
            <p className="text-sm leading-6 text-black/80">
              The tools that hold up here make ownership legible even after the
              conversation has moved on.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>Ownership is attached to the work itself.</li>
              <li>Assignment and status are visible without digging.</li>
              <li>Context stays connected to the task, ticket, thread, or project.</li>
              <li>The next action is clear even after the conversation moves on.</li>
            </ul>
            <p className="text-sm leading-6 text-black/65">
              These tools survive longer because visible responsibility reduces both
              coordination risk and cleanup work.
            </p>
          </Card>
        </section>
      </div>

      <section className="content-stack gap-4">
        <SectionHeading title="Tradeoff / when this flips" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Ownership-heavy tools may feel slower or too formal when the team is
            small, the work is casual, or coordination is already obvious.
          </p>
          <p className="text-sm leading-6 text-black/65">
            Discussion-first tools can be enough when speed matters more than
            durable accountability. This page is only saying that clearer ownership
            wins when ambiguity and manual reconstruction are the parts that keep
            breaking the workflow.
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
