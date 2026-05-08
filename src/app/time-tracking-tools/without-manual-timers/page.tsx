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
  "Find time tracking tools that reduce manual timer friction. See what fails first when starting, stopping, or switching timers breaks tracking.";

export const metadata: Metadata = {
  title: "Time Tracking Tools Without Manual Timers | ToolPicker",
  description: metaDescription,
  alternates: {
    canonical: absoluteUrl("/time-tracking-tools/without-manual-timers"),
  },
};

const pageData = {
  evidence: [
    {
      slug: "rescuetime-vs-toggl-track-for-busy-professional",
      whatFailsFirst:
        "Toggl Track fails first when manually starting and stopping timers turns tracking into a habit you have to remember all day.",
      whatHeldUpBetter:
        "RescueTime held up better by capturing activity in the background so the day stays visible even when starts and stops are missed.",
    },
    {
      slug: "activitywatch-vs-toggl-track-for-power-user",
      whatFailsFirst:
        "Toggl Track fails first when each task switch depends on another manual timer action and missed switches turn into reconstruction later.",
      whatHeldUpBetter:
        "ActivityWatch held up better by logging activity automatically and giving you something concrete to review after the work is done.",
    },
    {
      slug: "timely-vs-toggl-track-for-power-user",
      whatFailsFirst:
        "Toggl Track fails first when fast context switching makes repeated start-stop decisions too easy to miss.",
      whatHeldUpBetter:
        "Timely held up better by capturing activity in the background and letting you confirm entries later instead of rebuilding them from memory.",
    },
    {
      slug: "activitywatch-vs-timeular-for-minimalist",
      whatFailsFirst:
        "Timeular fails first when switching tasks still depends on a deliberate physical interaction and one missed switch creates a gap.",
      whatHeldUpBetter:
        "ActivityWatch held up better by running passively in the background without needing an extra action for each change in work.",
    },
    {
      slug: "manictime-vs-timeular-for-power-user",
      whatFailsFirst:
        "Timeular fails first when manual switching becomes timer babysitting and the record gets weaker every time a task change is missed.",
      whatHeldUpBetter:
        "ManicTime held up better by generating automatic activity logs that preserve a usable timeline even on messy days.",
    },
  ] satisfies EvidenceItem[],
} as const;

function getEvidenceLinks(items: readonly EvidenceItem[]) {
  return items.map((item) => {
    const page = loadPageBySlug(item.slug);

    if (!page) {
      throw new Error(
        `Expected comparison page "${item.slug}" to exist for the manual-timer proof page.`
      );
    }

    return {
      ...item,
      title: getComparisonDisplayTitle(page.title),
    };
  });
}

export default function TimeTrackingToolsWithoutManualTimersPage() {
  const evidenceLinks = getEvidenceLinks(pageData.evidence);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/time-tracking-tools" variant="ghost" className="px-0 py-0">
          Time Tracking Tools
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Time Tracking Tools Without Manual Timers
        </h1>
        <p className="max-w-2xl text-base leading-7 text-black/70">
          Choose a time tracker that still works when you forget to start the timer.
        </p>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-second verdict" />
        <Card className="space-y-3 border-black/15 bg-black/[0.03]">
          <p className="text-base leading-7 text-black/85">
            If manual timers break your tracking habit, prefer tools that capture
            activity automatically or reduce start/stop dependence.
          </p>
          <p className="text-sm leading-6 text-black/65">
            Be careful with tools where missing one timer start means the day&apos;s
            record becomes incomplete.
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
              Tools that survive when tracking has to happen in the background
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>
                <span className="font-medium text-black">RescueTime:</span>{" "}
                RescueTime survives this constraint when the record has to keep
                forming even while you are too busy to remember every timer start.
              </li>
              <li>
                <span className="font-medium text-black">Timely:</span> Timely
                survives this constraint when you need activity captured first and
                reviewed later instead of declared in real time.
              </li>
              <li>
                <span className="font-medium text-black">ActivityWatch:</span>{" "}
                ActivityWatch survives this constraint when background logging needs
                to preserve the day without repeated manual input.
              </li>
              <li>
                <span className="font-medium text-black">ManicTime:</span>{" "}
                ManicTime survives this constraint when missed switches would
                otherwise force too much cleanup and reconstruction.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Tools that fail first when tracking depends on manual timer starts
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>
                <span className="font-medium text-black">Toggl Track:</span> Toggl
                Track fails first here when accurate tracking still depends on
                remembering to start, stop, and switch timers throughout the day.
              </li>
              <li>
                <span className="font-medium text-black">Clockify:</span> Clockify
                fails first here when the timer habit breaks under repeated logging
                and missing one start weakens the rest of the record.
              </li>
              <li>
                <span className="font-medium text-black">Paymo Track:</span> Paymo
                Track fails first here when starting the timer already takes enough
                navigation that the manual initiation step gets skipped.
              </li>
              <li>
                <span className="font-medium text-black">Timeular:</span> Timeular
                fails first here when task changes still depend on deliberate
                switching and missed interactions leave holes in the timeline.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">This can flip when</h3>
            <p className="text-sm leading-6 text-black/75">
              Manual timers can make more sense when project billing precision
              matters, when you need intentional task-level tracking, or when manual
              control matters more than automatic completeness.
            </p>
          </div>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="How manual timers break time tracking" />
        <Card className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-black/60">
            What you need -&gt; what the tool makes you do -&gt; where it gets annoying
            -&gt; how it fails -&gt; what still works
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">What you need</p>
              <p className="text-sm leading-6 text-black/80">
                Reliable time records without remembering every start and stop.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                What the tool makes you do
              </p>
              <p className="text-sm leading-6 text-black/80">
                Manually start, stop, switch, or tag timers throughout the day.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                Where it gets annoying
              </p>
              <p className="text-sm leading-6 text-black/80">
                Meetings, deep work, context switching, or busy days interrupt the
                habit.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">How it fails</p>
              <p className="text-sm leading-6 text-black/80">
                Missing starts or stops creates incomplete or inaccurate records.
              </p>
            </Card>
            <Card className="space-y-2 border-black/10 bg-transparent p-4 shadow-none">
              <p className="text-xs uppercase tracking-wide text-black/55">
                What still works
              </p>
              <p className="text-sm leading-6 text-black/80">
                Automatic or low-interaction tracking reduces the memory burden.
              </p>
            </Card>
          </div>
          <p className="text-sm leading-6 text-black/65">
            In time tracking tools, the category breaks first at initiation
            reliability. Once the record depends on perfect recall, daily throughput
            turns against the tool.
          </p>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="content-stack gap-4">
          <SectionHeading title="What fails first" />
          <Card className="space-y-3">
            <p className="text-sm leading-6 text-black/80">
              Manual time trackers fail when the record only stays trustworthy if
              you remember each initiation step at the right moment.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>Tracking depends on remembering to start the timer.</li>
              <li>Switching tasks requires repeated manual correction.</li>
              <li>One missed timer weakens the whole day&apos;s record.</li>
              <li>Cleanup becomes a second job after the work is already done.</li>
            </ul>
            <p className="text-sm leading-6 text-black/65">
              The repeated pattern is simple: manual initiation feels manageable at
              first, then repeated logging compounds until accuracy depends more on
              memory than on the tracker.
            </p>
          </Card>
        </section>

        <section className="content-stack gap-4">
          <SectionHeading title="What survives" />
          <Card className="space-y-3">
            <p className="text-sm leading-6 text-black/80">
              The tools that hold up here preserve a usable timeline even when the
              day is interrupted, messy, or only partly supervised.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>Activity capture happens in the background.</li>
              <li>Tracking does not depend on perfect user memory.</li>
              <li>Corrections are occasional rather than constant.</li>
              <li>The system preserves a useful record even on messy days.</li>
            </ul>
            <p className="text-sm leading-6 text-black/65">
              These tools survive longer because review stays lighter than
              reconstruction.
            </p>
          </Card>
        </section>
      </div>

      <section className="content-stack gap-4">
        <SectionHeading title="Tradeoff / when this flips" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Automatic tracking may be less precise for billing or project-specific
            reporting.
          </p>
          <p className="text-sm leading-6 text-black/65">
            Manual timers can be worth accepting when exact client billing, task
            labels, or intentional time allocation matter more than automatic
            completeness. This page is only saying that background capture holds up
            better when remembering to start and stop is the part that keeps
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
