import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import { listAllCategoryGates } from "@/content/categoryGates/listAll";
import { absoluteUrl } from "@/lib/site";

type Params = { category: string };
type GateViewModel = {
  orientation: string[];
  startHere: {
    slug: string;
    reason: string;
    cta: string;
  };
  filterDescriptions: Record<string, string>;
  howFiltersWork: string[];
};

function cleanTitle(value: string) {
  return value.replace(/^Quick (Gate|Filter):\s*/i, "").trim();
}

function getCategoryGates(category: string) {
  return listAllCategoryGates()
    .filter((gate) => gate.categorySlug === category)
    .sort((a, b) => a.embedBlockTitle.localeCompare(b.embedBlockTitle));
}

const CATEGORY_PAGE_COPY: Record<string, GateViewModel> = {
  "bookmark-managers": {
    orientation: [
      "In bookmark managers, things usually break when saving and finding links starts taking more effort than the links are worth.",
      "Start with the filter that checks daily friction first, because that is where this category usually falls apart.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily use is the main failure point here: if saving, sorting, or finding links feels slow, people stop using the tool.",
      cta: "Open the daily-use filter",
    },
    filterDescriptions: {
      "time-scarcity":
        "Checks whether the tool stays quick to save into, scan, and come back to when your attention is already stretched.",
      "ceiling-check":
        "Checks whether the tool still holds up once your bookmark pile gets larger, messier, or more structured.",
    },
    howFiltersWork: [
      "Each filter checks a different way bookmark managers fail.",
      "If a tool breaks under that condition, it gets ruled out first.",
      "What stays on the page are the tools that keep working under the limit you care about most.",
    ],
  },
  "calendar-tools": {
    orientation: [
      "In calendar tools, things usually break when the system needs too much babysitting to stay useful.",
      "Start with the filter that checks upkeep first, because recurring tweaks, rules, and scheduling cleanup are where this category often goes wrong.",
    ],
    startHere: {
      slug: "maintenance-load",
      reason:
        "Ongoing upkeep is the strongest failure point here: if your calendar needs constant fixing, people stop trusting it.",
      cta: "Open the upkeep filter",
    },
    filterDescriptions: {
      "setup-tolerance":
        "Checks whether you can get a working calendar flow in place without a long setup pass first.",
      "time-scarcity":
        "Checks whether the tool helps you move through the day quickly instead of adding more scheduling decisions.",
      "feature-aversion":
        "Checks whether the tool stays clear and manageable if you do not want extra layers on top of your calendar.",
      "ceiling-check":
        "Checks whether the tool still holds up once your scheduling gets heavier, more connected, or more demanding.",
    },
    howFiltersWork: [
      "Each filter checks a different way calendar tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the calendars that still hold up under the limit you care about most.",
    ],
  },
  "customer-support-helpdesk-tools": {
    orientation: [
      "In helpdesk tools, things usually break when handling incoming messages starts taking too many clicks, too much context switching, or too much mental sorting.",
      "Start with the filter that checks daily speed first, because queue friction is where this category most often falls apart.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily handling speed is the main failure point here: if triage and replies feel heavy, the whole support workflow backs up fast.",
      cta: "Open the daily-speed filter",
    },
    filterDescriptions: {
      "time-scarcity":
        "Checks whether the tool helps you move through tickets and conversations quickly when attention is already stretched.",
      "ceiling-check":
        "Checks whether the tool still holds up once support volume, routing needs, or team complexity grows.",
    },
    howFiltersWork: [
      "Each filter checks a different way helpdesk tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the support tools that still hold up under the limit you care about most.",
    ],
  },
  "email-inbox-tools": {
    orientation: [
      "In email tools, things usually break when getting through the inbox takes too many decisions, too much sorting, or too much rereading.",
      "Start with the filter that checks daily speed first, because inbox friction is the most common failure point in this category.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily handling speed is the main break point here: if clearing, triaging, and revisiting email feels slow, the inbox turns into drag almost immediately.",
      cta: "Open the daily-speed filter",
    },
    filterDescriptions: {
      "setup-tolerance":
        "Checks whether you can get into a working inbox quickly without a long setup or migration effort.",
      "feature-aversion":
        "Checks whether the tool stays calm and readable if you do not want extra layers in your inbox.",
      "ceiling-check":
        "Checks whether the tool still holds up once your email volume, workflows, or routing needs get heavier.",
    },
    howFiltersWork: [
      "Each filter checks a different way inbox tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the inbox tools that still hold up under the limit you care about most.",
    ],
  },
  "file-storage-cloud-storage-tools": {
    orientation: [
      "In file storage tools, things usually break when syncing, sharing, or recovering files starts needing too much attention to stay reliable.",
      "Start with the filter that checks upkeep first, because maintenance drag is where this category most often falls apart.",
    ],
    startHere: {
      slug: "maintenance-load",
      reason:
        "Ongoing upkeep is the main failure point here: if storage needs constant checking or fixing, trust disappears fast.",
      cta: "Open the upkeep filter",
    },
    filterDescriptions: {
      "time-scarcity":
        "Checks whether the tool stays quick to upload, find, and share files when you do not have time to hunt around.",
      "maintenance-load":
        "Checks whether the tool keeps working without constant sync cleanup, manual fixes, or ongoing management.",
    },
    howFiltersWork: [
      "Each filter checks a different way storage tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the storage tools that still hold up under the limit you care about most.",
    ],
  },
  "habit-trackers": {
    orientation: [
      "In habit trackers, things usually break when recording the habit starts feeling like one more task to manage.",
      "Start with the filter that checks daily friction first, because this category usually fails when the tracker is too annoying to keep opening.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily use is the main failure point here: if checking in takes too much effort, the habit disappears before the tracker helps.",
      cta: "Open the daily-use filter",
    },
    filterDescriptions: {
      "setup-tolerance":
        "Checks whether you can get a habit system running quickly without building too much structure first.",
      "maintenance-load":
        "Checks whether the tracker keeps working without constant cleanup, reconfiguration, or manual tending.",
      "feature-aversion":
        "Checks whether the tracker stays simple if you just want to log the habit and move on.",
      "ceiling-check":
        "Checks whether the tracker still holds up once your habits, goals, or tracking detail grow.",
    },
    howFiltersWork: [
      "Each filter checks a different way habit trackers fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the trackers that still hold up under the limit you care about most.",
    ],
  },
  "note-taking-apps": {
    orientation: [
      "In note-taking apps, things usually break when the system starts feeling fragile, over-structured, or easy to mess up.",
      "Start with the filter that checks safety first, because trust breaks before note volume does in this category.",
    ],
    startHere: {
      slug: "fear-of-breaking",
      reason:
        "Feeling safe is the main failure point here: if a notes app makes people worry about structure, settings, or doing it wrong, they stop capturing notes into it.",
      cta: "Open the safety filter",
    },
    filterDescriptions: {
      "setup-tolerance":
        "Checks whether you can start taking usable notes quickly without building a whole system first.",
      "maintenance-load":
        "Checks whether the app keeps working without constant reorganizing, cleanup, or system maintenance.",
      "switching-cost":
        "Checks whether you can use the app for now without getting stuck in it later.",
      "time-scarcity":
        "Checks whether the app stays quick enough for capture and retrieval when your attention is already stretched.",
      "feature-aversion":
        "Checks whether the app stays calm and simple if you do not want lots of layers around your notes.",
      "ceiling-check":
        "Checks whether the app still holds up once your notes, structure, or research load grows.",
    },
    howFiltersWork: [
      "Each filter checks a different way note-taking apps fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the notes apps that still hold up under the limit you care about most.",
    ],
  },
  "password-managers": {
    orientation: [
      "In password managers, things usually break when the tool feels easy to misconfigure, easy to lock yourself out of, or hard to trust.",
      "Start with the filter that checks safety first, because fear of breaking access is the main way this category falls apart.",
    ],
    startHere: {
      slug: "fear-of-breaking",
      reason:
        "Safety is the main failure point here: if the password manager feels risky to set up or use, people avoid it or abandon it.",
      cta: "Open the safety filter",
    },
    filterDescriptions: {
      "setup-tolerance":
        "Checks whether you can get protected quickly without a long setup or migration process.",
      "time-scarcity":
        "Checks whether saving and filling passwords stays fast enough to use every day.",
      "feature-aversion":
        "Checks whether the tool stays straightforward if you just want core password management.",
      "ceiling-check":
        "Checks whether the tool still holds up once your vault, sharing needs, or advanced use gets heavier.",
    },
    howFiltersWork: [
      "Each filter checks a different way password managers fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the password managers that still hold up under the limit you care about most.",
    ],
  },
  "project-management-tools": {
    orientation: [
      "In project management tools, things usually break when the system becomes too easy to overbuild, misconfigure, or turn into admin work.",
      "Start with the filter that checks safety first, because this category often fails when the setup feels fragile before it becomes useful.",
    ],
    startHere: {
      slug: "fear-of-breaking",
      reason:
        "Structure safety is the main failure point here: if the tool makes people worry about breaking workflows or setting things up wrong, they stop trusting the system.",
      cta: "Open the safety filter",
    },
    filterDescriptions: {
      "setup-tolerance":
        "Checks whether you can get a workable project system running without a long setup pass first.",
      "time-scarcity":
        "Checks whether the tool stays quick enough for planning and updates when attention is already stretched.",
      "feature-aversion":
        "Checks whether the tool stays manageable if you do not want layers of process around simple work.",
      "ceiling-check":
        "Checks whether the tool still holds up once projects, teammates, or process demands get heavier.",
    },
    howFiltersWork: [
      "Each filter checks a different way project management tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the project tools that still hold up under the limit you care about most.",
    ],
  },
  "read-it-later-apps": {
    orientation: [
      "In read-it-later apps, things usually break when saving, resurfacing, or actually getting back to articles starts taking too much attention.",
      "Start with the filter that checks daily friction first, because this category usually fails when the reading queue becomes one more inbox to manage.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily use is the main failure point here: if clipping and returning to saved reading feels heavy, people stop saving things at all.",
      cta: "Open the daily-use filter",
    },
    filterDescriptions: {
      "feature-aversion":
        "Checks whether the tool stays simple if you just want to save something and read it later.",
      "ceiling-check":
        "Checks whether the tool still holds up once your reading backlog, annotations, or organization needs get heavier.",
    },
    howFiltersWork: [
      "Each filter checks a different way read-it-later apps fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the reading tools that still hold up under the limit you care about most.",
    ],
  },
  "scheduling-booking-tools": {
    orientation: [
      "In scheduling and booking tools, things usually break when you have to configure too much before anyone can actually book time with you.",
      "Start with the filter that checks setup first, because this category most often falls apart before the first booking link is even live.",
    ],
    startHere: {
      slug: "setup-tolerance",
      reason:
        "Setup is the main failure point here: if getting from account to bookable link takes too much work, people never get the system into use.",
      cta: "Open the setup filter",
    },
    filterDescriptions: {
      "switching-cost":
        "Checks whether you can use the tool for now without getting stuck in it later.",
      "time-scarcity":
        "Checks whether the tool stays quick to manage once bookings, changes, and daily scheduling requests start coming in.",
      "ceiling-check":
        "Checks whether the tool still holds up once your booking volume, routing rules, or scheduling complexity grows.",
    },
    howFiltersWork: [
      "Each filter checks a different way scheduling tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the booking tools that still hold up under the limit you care about most.",
    ],
  },
  "spreadsheet-database-tools": {
    orientation: [
      "In spreadsheet and database tools, things usually break when the structure feels easy to damage, hard to trust, or too fragile to edit confidently.",
      "Start with the filter that checks safety first, because fear of breaking the system is where this category most often falls apart.",
    ],
    startHere: {
      slug: "fear-of-breaking",
      reason:
        "Safety is the main failure point here: if people think one wrong edit will break the whole system, they stop using it with confidence.",
      cta: "Open the safety filter",
    },
    filterDescriptions: {
      "ceiling-check":
        "Checks whether the tool still holds up once your data, workflows, and structure get more demanding.",
    },
    howFiltersWork: [
      "Each filter checks a different way spreadsheet and database tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the tools that still hold up under the limit you care about most.",
    ],
  },
  "task-managers": {
    orientation: [
      "In task managers, things usually break when keeping the system up to date starts feeling like one more task on the list.",
      "Start with the filter that checks daily friction first, because this category most often falls apart when planning takes too much effort to maintain.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily use is the main failure point here: if capture, review, and completion take too much attention, the system stops getting trusted.",
      cta: "Open the daily-use filter",
    },
    filterDescriptions: {
      "setup-tolerance":
        "Checks whether you can get a working task system running without a long setup pass first.",
      "maintenance-load":
        "Checks whether the system keeps working without constant cleanup, re-sorting, or admin work.",
      "switching-cost":
        "Checks whether you can use the tool for now without getting stuck in it later.",
      "feature-aversion":
        "Checks whether the tool stays simple if you just want to track work without extra process layers.",
      "fear-of-breaking":
        "Checks whether the tool feels safe to edit without worrying that one change will mess up the whole system.",
      "ceiling-check":
        "Checks whether the tool still holds up once your projects, contexts, or planning needs get heavier.",
    },
    howFiltersWork: [
      "Each filter checks a different way task managers fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the task tools that still hold up under the limit you care about most.",
    ],
  },
  "team-collaboration-tools": {
    orientation: [
      "In team collaboration tools, things usually break when keeping up with messages, channels, and coordination takes more attention than the work itself.",
      "Start with the filter that checks daily speed first, because noise and message drag are where this category usually falls apart.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily handling speed is the main failure point here: if team communication takes too much attention, people miss things or tune the tool out.",
      cta: "Open the daily-speed filter",
    },
    filterDescriptions: {
      "feature-aversion":
        "Checks whether the tool stays simple if you do not want extra layers around team communication.",
    },
    howFiltersWork: [
      "Each filter checks a different way collaboration tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the collaboration tools that still hold up under the limit you care about most.",
    ],
  },
  "time-tracking-tools": {
    orientation: [
      "In time tracking tools, things usually break when starting, stopping, correcting, or categorizing time takes more effort than the work being tracked.",
      "Start with the filter that checks daily friction first, because this category usually falls apart when tracking itself becomes a distraction.",
    ],
    startHere: {
      slug: "time-scarcity",
      reason:
        "Daily use is the main failure point here: if logging time takes too much attention, people stop tracking accurately or stop tracking at all.",
      cta: "Open the daily-use filter",
    },
    filterDescriptions: {
      "setup-tolerance":
        "Checks whether you can get tracking started quickly without a long setup pass first.",
      "maintenance-load":
        "Checks whether the tool keeps working without constant cleanup, fixing, or admin overhead.",
      "feature-aversion":
        "Checks whether the tool stays simple if you just want to track time without extra layers.",
      "fear-of-breaking":
        "Checks whether the tool feels safe to use without worrying that one wrong change will break reports or workflows.",
      "ceiling-check":
        "Checks whether the tool still holds up once your clients, projects, billing rules, or reporting needs get heavier.",
    },
    howFiltersWork: [
      "Each filter checks a different way time tracking tools fail.",
      "Tools that break under that condition get eliminated first.",
      "The goal is to narrow toward the time trackers that still hold up under the limit you care about most.",
    ],
  },
};

export async function generateStaticParams() {
  const categories = Array.from(
    new Set(listAllCategoryGates().map((gate) => gate.categorySlug))
  ).sort((a, b) => a.localeCompare(b));
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const gates = getCategoryGates(category);
  if (!gates.length) return { title: "Category not found" };
  const pageCopy = CATEGORY_PAGE_COPY[category];

  return {
    title: `${gates[0].categoryLabel} | Tools`,
    description:
      pageCopy?.orientation[0] ?? `Quick filters for ${gates[0].categoryLabel}.`,
    alternates: {
      canonical: absoluteUrl(`/tools/${category}`),
    },
  };
}

export default async function ToolsCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const gates = getCategoryGates(category);
  if (!gates.length) return notFound();

  const categoryLabel = gates[0].categoryLabel;
  const pageCopy = CATEGORY_PAGE_COPY[category];

  if (!pageCopy) {
    return (
      <main className="site-container page-shell content-stack">
        <header className="max-w-3xl space-y-4">
          <ButtonLink href="/tools" variant="ghost" className="px-0 py-0">
            All tool filters
          </ButtonLink>
          <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            {categoryLabel}
          </h1>
          <p className="text-black/70">
            Pick the filter that matches your situation, then check one tool or
            compare two tools directly.
          </p>
          <div className="flex flex-wrap gap-2">
            {gates.map((gate) => (
              <PillLink
                key={`${gate.categorySlug}-${gate.constraintSlug}`}
                href={`/tools/${gate.categorySlug}/${gate.constraintSlug}`}
              >
                {gate.uiConstraintName ?? gate.constraintLabel}
              </PillLink>
            ))}
          </div>
        </header>

        <section className="content-stack gap-4">
          <SectionHeading title="Available filters" />
          <div className="grid gap-4 sm:grid-cols-2">
            {gates.map((gate) => (
              <Card
                key={`${gate.categorySlug}-${gate.constraintSlug}`}
                className="space-y-3"
              >
                <h2 className="text-lg font-semibold tracking-tight text-black">
                  {cleanTitle(gate.embedBlockTitle)}
                </h2>
                <p className="text-sm text-black/70">
                  {gate.description[0] ||
                    "Open this filter to narrow options quickly."}
                </p>
                <Link
                  href={`/tools/${gate.categorySlug}/${gate.constraintSlug}`}
                  className="text-sm text-black/80 hover:text-black hover:underline"
                >
                  Open filter
                </Link>
              </Card>
            ))}
          </div>
        </section>
      </main>
    );
  }

  const startGate =
    gates.find((gate) => gate.constraintSlug === pageCopy.startHere.slug) ?? gates[0];
  const secondaryGates = gates.filter(
    (gate) => gate.constraintSlug !== startGate.constraintSlug
  );

  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-3xl space-y-4">
        <ButtonLink href="/tools" variant="ghost" className="px-0 py-0">
          All tool filters
        </ButtonLink>
        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          {categoryLabel}
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="Category orientation" />
        <div className="max-w-3xl space-y-2 text-sm leading-6 text-black/70">
          {pageCopy.orientation.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start here" />
        <Card className="space-y-3 border-black/15 bg-black/[0.02]">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            {cleanTitle(startGate.embedBlockTitle)}
          </h2>
          <p className="text-sm text-black/70">{pageCopy.startHere.reason}</p>
          <Link
            href={`/tools/${startGate.categorySlug}/${startGate.constraintSlug}`}
            className="text-sm font-medium text-black/80 hover:text-black hover:underline"
          >
            {pageCopy.startHere.cta}
          </Link>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Other ways to filter" />
        <div className="grid gap-4 sm:grid-cols-2">
          {secondaryGates.map((gate) => (
            <Card
              key={`${gate.categorySlug}-${gate.constraintSlug}`}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold tracking-tight text-black">
                {cleanTitle(gate.embedBlockTitle)}
              </h2>
              <p className="text-sm text-black/70">
                {pageCopy.filterDescriptions[gate.constraintSlug] ??
                  gate.description[0] ??
                  "Open this filter to narrow options quickly."}
              </p>
              <Link
                href={`/tools/${gate.categorySlug}/${gate.constraintSlug}`}
                className="text-sm text-black/80 hover:text-black hover:underline"
              >
                Open filter
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="How these filters work" />
        <div className="max-w-3xl space-y-2 text-sm leading-6 text-black/70">
          {pageCopy.howFiltersWork.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
