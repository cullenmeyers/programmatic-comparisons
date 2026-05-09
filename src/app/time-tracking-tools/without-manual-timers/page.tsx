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
        "Toggl Track can fail first when each task switch depends on another manual timer action and missed switches turn into reconstruction later.",
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
            If manual timers break your tracking habit, prefer tools that preserve
            a reviewable activity timeline in the background so missed starts do
            not force you to rebuild the day from memory.
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
                RescueTime survives this constraint when you use its Timesheets
                workflow to turn background activity into suggested project time
                that you review later, rather than starting every timer yourself.
              </li>
              <li>
                <span className="font-medium text-black">Timely:</span> Timely
                survives this constraint when Memory is running on your computer
                and you want activity captured first, then assigned to projects
                and tasks later.
              </li>
              <li>
                <span className="font-medium text-black">ActivityWatch:</span>{" "}
                ActivityWatch survives this constraint when you want a local
                background timeline and are comfortable with a more setup-heavy,
                self-managed workflow.
              </li>
              <li>
                <span className="font-medium text-black">ManicTime:</span>{" "}
                ManicTime survives this constraint when you want automatic
                activity timelines first and are willing to review or assign that
                captured time afterward.
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
                Track fails first here in manual timer-first workflows, where
                accurate tracking still depends on remembering to start, stop, or
                switch entries throughout the day.
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
              The tools that hold up here preserve a usable passive timeline that
              can be reviewed later, even if they do not fully auto-attribute
              every block to the right project.
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
        <SectionHeading title="Evidence behind this pattern" />
        <Card className="space-y-4">
          <p className="text-sm leading-6 text-black/75">
            This pattern is strongest when current product behavior and comparison
            evidence point to the same manual-initiation failure.
          </p>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Current product behavior behind the pattern
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
              <li>
                RescueTime captures activity in the background, but Timesheets
                suggestions are reviewed later and live on Timesheets plans.
              </li>
              <li>
                Timely supports automatic capture and later review through the
                Memory desktop app on supported plans.
              </li>
              <li>
                ActivityWatch logs activity locally in the background, with more
                setup and self-management than hosted trackers.
              </li>
              <li>
                ManicTime generates automatic activity timelines and supports
                later assignment to projects.
              </li>
              <li>
                Toggl Track still centers manual timer use in its main flow, even
                though its desktop app now also offers timeline and rule-based
                autotracker features.
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Existing comparison evidence
            </h3>
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
          </div>
          <p className="text-sm leading-6 text-black/65">
            More examples should only be added when they match this same
            manual-initiation failure pattern.
          </p>
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
