import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import { getCategoryGate } from "@/content/categoryGates";
import {
  buildCategoryHubPreview,
  getComparisonDisplayTitle,
  getComparisonTitleBySlug,
  getCategoryIndexBySlug,
  isLockedPersona,
  listCategoryIndexes,
  LOCKED_PERSONA_ORDER,
  loadPageBySlug,
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

const SITUATION_FILTERS = [
  { label: "Publish fast", constraintSlug: "setup-tolerance" },
  { label: "Works without upkeep", constraintSlug: "maintenance-load" },
  { label: "Easy to quit later", constraintSlug: "switching-cost" },
  { label: "Fast to use daily", constraintSlug: "time-scarcity" },
  { label: "Grows with you", constraintSlug: "ceiling-check" },
  { label: "Hard to mess up", constraintSlug: "fear-of-breaking" },
  { label: "Keeps it simple", constraintSlug: "feature-aversion" },
] as const;

type DecisionPersona = {
  name: string;
  explanation: string;
  comparisonSlugs: string[];
};

type TopComparison = {
  slug: string;
  failureMechanism: string;
};

type PersonaSituationItem = {
  slug: string;
  title: string;
};

type PersonaSituationCard = {
  name: string;
  explanation: string;
  comparisons: PersonaSituationItem[];
};

function buildPersonaSituationCards(
  personas: DecisionPersona[],
  categorySlug: string
): PersonaSituationCard[] {
  const categoryPages = getCategoryIndexBySlug(categorySlug)?.pages ?? [];

  return personas
    .map((persona) => ({
      ...persona,
      comparisons: [
        ...persona.comparisonSlugs.flatMap((slug) => {
          const comparison = loadPageBySlug(slug);
          if (!comparison || comparison.persona !== persona.name) {
            return [];
          }

          return [
            {
              slug,
              title: getComparisonDisplayTitle(comparison.title),
            },
          ];
        }),
        ...categoryPages
          .filter((page) => page.persona === persona.name)
          .filter((page) => !persona.comparisonSlugs.includes(page.slug))
          .slice(0, Math.max(persona.comparisonSlugs.length, 4))
          .map((page) => ({
            slug: page.slug,
            title: getComparisonDisplayTitle(page.title),
          })),
      ].slice(0, Math.max(persona.comparisonSlugs.length, 4)),
    }))
    .filter((persona) => persona.comparisons.length > 0);
}

function buildTopComparisonCards(topComparisons: TopComparison[]) {
  return topComparisons.map((comparison) => ({
    ...comparison,
    title: getComparisonTitleBySlug(comparison.slug),
  }));
}

function PersonaSituationGrid({ personas }: { personas: PersonaSituationCard[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {personas.map((persona) => (
        <Card key={persona.name} className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-black">
              {persona.name}
            </h2>
            <p className="max-w-[58ch] text-[0.9375rem] leading-6 text-black/55">
              {persona.explanation}
            </p>
          </div>
          <div className="space-y-2 border-t border-black/10 pt-3 text-sm leading-6">
            {persona.comparisons.map((comparison) => (
              <Link
                key={comparison.slug}
                href={`/compare/${comparison.slug}`}
                className="block font-medium text-black/80 underline-offset-4 hover:text-black hover:underline"
              >
                {comparison.title}
              </Link>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function renderSituationFilterSection(categorySlug: string) {
  const filters = SITUATION_FILTERS.flatMap((filter) => {
    const gate = getCategoryGate(categorySlug, filter.constraintSlug);
    if (!gate) return [];

    return [
      {
        href: `/tools/${categorySlug}/${filter.constraintSlug}`,
        label: filter.label,
      },
    ];
  });

  if (filters.length === 0) return null;

  return (
    <section className="content-stack gap-4">
      <SectionHeading title="Pick based on your situation" />
      <Card>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {filters.map((filter) => (
            <li key={filter.href}>
              <Link
                href={filter.href}
                className="text-black/80 underline-offset-4 hover:text-black hover:underline"
              >
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

const TASK_MANAGER_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the tool makes you learn a system before adding a task, it already lost.",
    comparisonSlugs: [
      "apple-reminders-vs-omnifocus-for-beginner",
      "notion-vs-todoist-for-beginner",
      "google-tasks-vs-trello-for-beginner",
      "clickup-vs-microsoft-to-do-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the tool needs constant cleanup, redesign, or infrastructure care, it stops being useful.",
    comparisonSlugs: [
      "microsoft-to-do-vs-notion-for-solo-user",
      "apple-reminders-vs-sunsama-for-solo-user",
      "trello-vs-wekan-for-solo-user",
      "asana-vs-microsoft-to-do-for-solo-user",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the setup takes longer than the semester benefit, the tool fails.",
    comparisonSlugs: [
      "todoist-vs-trello-for-student",
      "apple-reminders-vs-things-3-for-student",
      "sunsama-vs-todoist-for-student",
      "google-tasks-vs-superlist-for-student",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If capture or execution takes extra steps, the tool loses under time pressure.",
    comparisonSlugs: [
      "apple-reminders-vs-asana-for-busy-professional",
      "apple-reminders-vs-sunsama-for-busy-professional",
      "clickup-vs-todoist-for-busy-professional",
      "linear-vs-todoist-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the structure caps out under filtering, dependencies, or workflow depth, it fails.",
    comparisonSlugs: [
      "asana-vs-trello-for-power-user",
      "microsoft-to-do-vs-omnifocus-for-power-user",
      "taskwarrior-vs-todoist-for-power-user",
      "apple-reminders-vs-taskheat-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the structure feels fragile or easy to misconfigure, trust disappears.",
    comparisonSlugs: [
      "microsoft-planner-vs-microsoft-to-do-for-non-technical-user",
      "apple-reminders-vs-trello-for-non-technical-user",
      "basecamp-vs-microsoft-to-do-for-non-technical-user",
      "remember-the-milk-vs-taskwarrior-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the tool adds modes, views, or workflow layers before simple capture, it fails.",
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
    failureMechanism: "Too much system before simple capture.",
  },
  {
    slug: "apple-reminders-vs-sunsama-for-busy-professional",
    failureMechanism: "Planning ritual before daily execution.",
  },
  {
    slug: "microsoft-to-do-vs-notion-for-solo-user",
    failureMechanism: "Maintenance overhead over time.",
  },
  {
    slug: "todoist-vs-trello-for-student",
    failureMechanism: "Structure heavier than the time horizon.",
  },
  {
    slug: "microsoft-planner-vs-microsoft-to-do-for-non-technical-user",
    failureMechanism: "Formal structure that feels easy to break.",
  },
  {
    slug: "asana-vs-trello-for-power-user",
    failureMechanism: "Coordination breaks when dependencies matter.",
  },
  {
    slug: "apple-reminders-vs-clickup-for-minimalist",
    failureMechanism: "Too much system before a basic checklist.",
  },
  {
    slug: "taskwarrior-vs-todoist-for-power-user",
    failureMechanism: "GUI ceiling when programmable control matters.",
  },
];

const NOTE_TAKING_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the app asks you to understand structure before writing, it fails immediately.",
    comparisonSlugs: [
      "apple-notes-vs-notion-for-beginner",
      "notion-vs-onenote-for-beginner",
      "evernote-vs-google-keep-for-beginner",
      "apple-notes-vs-logseq-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the note system needs ongoing redesign or subscription decisions, it becomes a burden.",
    comparisonSlugs: [
      "apple-notes-vs-notion-for-solo-user",
      "joplin-vs-notion-for-solo-user",
      "apple-notes-vs-evernote-for-solo-user",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the note system takes longer to learn than the class lasts, it is the wrong system.",
    comparisonSlugs: [
      "apple-notes-vs-obsidian-for-student",
      "google-docs-vs-notion-for-student",
      "obsidian-vs-remnote-for-student",
      "craft-vs-google-docs-for-student",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If capture takes more than a few seconds, notes stop happening.",
    comparisonSlugs: [
      "google-keep-vs-notion-for-busy-professional",
      "apple-notes-vs-craft-for-busy-professional",
      "google-keep-vs-obsidian-for-busy-professional",
      "notion-vs-nuclino-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the app cannot scale to linking, automation, search depth, or extensibility, it caps out.",
    comparisonSlugs: [
      "apple-notes-vs-obsidian-for-power-user",
      "devonthink-vs-joplin-for-power-user",
      "jupyter-notebook-vs-quiver-for-power-user",
      "standard-notes-vs-tiddlywiki-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If storage, sync, or security settings feel risky, trust disappears.",
    comparisonSlugs: [
      "apple-notes-vs-evernote-for-non-technical-user",
      "apple-notes-vs-logseq-for-non-technical-user",
      "google-keep-vs-standard-notes-for-non-technical-user",
      "obsidian-vs-simplenote-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the app pushes systems, panels, or layouts before plain writing, it fails.",
    comparisonSlugs: [
      "bear-vs-notion-for-minimalist",
      "apple-notes-vs-obsidian-for-minimalist",
      "bear-vs-evernote-for-minimalist",
      "notion-vs-simplenote-for-minimalist",
    ],
  },
];

const NOTE_TAKING_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "apple-notes-vs-notion-for-beginner",
    failureMechanism: "Structure before first note.",
  },
  {
    slug: "google-keep-vs-notion-for-busy-professional",
    failureMechanism: "Organization friction before capture.",
  },
  {
    slug: "apple-notes-vs-notion-for-solo-user",
    failureMechanism: "System upkeep over time.",
  },
  {
    slug: "google-docs-vs-notion-for-student",
    failureMechanism: "Workspace overhead for short-term collaboration.",
  },
  {
    slug: "apple-notes-vs-logseq-for-non-technical-user",
    failureMechanism: "File and sync complexity that feels risky.",
  },
  {
    slug: "apple-notes-vs-obsidian-for-power-user",
    failureMechanism: "Ceiling hit when linking and extensibility matter.",
  },
  {
    slug: "bear-vs-notion-for-minimalist",
    failureMechanism: "Too much interface between you and the note.",
  },
  {
    slug: "jupyter-notebook-vs-quiver-for-power-user",
    failureMechanism: "Static code notes when live execution matters.",
  },
];

const BOOKMARK_MANAGER_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If saving a link requires learning views, collections, or structure before the first bookmark, it slows adoption.",
    comparisonSlugs: [
      "pinboard-vs-raindropio-for-beginner",
      "pinboard-vs-raindropio-for-busy-professional",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the bookmark system needs extra organization work every time you save or retrieve, it becomes another inbox to manage.",
    comparisonSlugs: [
      "historious-vs-pinboard-for-busy-professional",
      "pinboard-vs-refind-for-busy-professional",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the setup is heavier than the course or semester window, it is the wrong bookmark workflow.",
    comparisonSlugs: [
      "pocket-vs-wallabag-for-student",
      "pinboard-vs-raindropio-for-beginner",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If bookmarking or retrieving links adds context switching, tagging work, or scanning time, it fails under pressure.",
    comparisonSlugs: [
      "historious-vs-pinboard-for-busy-professional",
      "pinboard-vs-refind-for-busy-professional",
      "pinboard-vs-raindropio-for-busy-professional",
      "favro-bookmarks-feature-vs-raindropio-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the tool cannot support archival depth, visual libraries, or precise manual control, it caps out fast.",
    comparisonSlugs: [
      "archivebox-vs-raindropio-for-power-user",
      "anybox-vs-mymind-for-power-user",
      "eagle-asset-manager-vs-raindropio-for-power-user",
      "pearltrees-vs-raindropio-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the tool introduces accounts, sync layers, or self-hosting decisions, confidence drops immediately.",
    comparisonSlugs: [
      "goodlinks-vs-linkace-for-non-technical-user",
      "goodlinks-vs-raindropio-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the bookmark manager asks for metadata, layout, or dashboard decisions before saving a link, it gets in the way.",
    comparisonSlugs: [
      "anybox-vs-raindropio-for-minimalist",
      "raindropio-vs-startme-for-minimalist",
    ],
  },
];

const BOOKMARK_MANAGER_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "pinboard-vs-raindropio-for-beginner",
    failureMechanism: "Too much structure before the first saved link.",
  },
  {
    slug: "historious-vs-pinboard-for-busy-professional",
    failureMechanism: "Manual tagging slows retrieval later.",
  },
  {
    slug: "pinboard-vs-refind-for-busy-professional",
    failureMechanism: "Manual refinding breaks under time pressure.",
  },
  {
    slug: "favro-bookmarks-feature-vs-raindropio-for-busy-professional",
    failureMechanism: "Separate-tool context switching during active work.",
  },
  {
    slug: "goodlinks-vs-linkace-for-non-technical-user",
    failureMechanism: "Self-hosting complexity before simple saving.",
  },
  {
    slug: "archivebox-vs-raindropio-for-power-user",
    failureMechanism: "Bookmarking ceiling when full-page archival matters.",
  },
  {
    slug: "eagle-asset-manager-vs-raindropio-for-power-user",
    failureMechanism: "Visual-library ceiling when files matter more than links.",
  },
  {
    slug: "raindropio-vs-startme-for-minimalist",
    failureMechanism: "Dashboard overhead instead of plain bookmarking.",
  },
];

const CALENDAR_TOOL_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If adding the first event requires learning accounts, folders, or shared-calendar structure, the tool already lost.",
    comparisonSlugs: [
      "apple-calendar-vs-outlook-calendar-for-beginner",
      "cron-vs-google-calendar-for-beginner",
      "google-calendar-vs-teamup-calendar-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the calendar keeps needing tuning, workspace links, or resource rules, it becomes overhead.",
    comparisonSlugs: [
      "apple-calendar-vs-notion-calendar-for-solo-user",
      "google-calendar-vs-reclaim-ai-for-solo-user",
      "google-calendar-vs-skedda-for-solo-user",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the calendar system is heavier than the actual class or term schedule, it is the wrong level of tool.",
    comparisonSlugs: [
      "apple-calendar-vs-outlook-calendar-for-beginner",
      "google-calendar-vs-teamup-calendar-for-beginner",
      "apple-calendar-vs-notion-calendar-for-minimalist",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If the calendar makes you babysit scheduling logic or fight context switching, it fails under time pressure.",
    comparisonSlugs: [
      "akiflow-vs-google-calendar-for-busy-professional",
      "clockwise-vs-google-calendar-for-busy-professional",
      "google-calendar-vs-motion-for-busy-professional",
      "google-calendar-vs-reclaim-ai-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the calendar cannot automate scheduling or enforce real booking constraints, it caps out fast.",
    comparisonSlugs: [
      "fantastical-vs-motion-for-power-user",
      "google-calendar-vs-motion-for-power-user",
      "skedda-vs-teamup-calendar-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the calendar exposes too much hidden structure or automation logic, confidence disappears.",
    comparisonSlugs: [
      "apple-calendar-vs-outlook-calendar-for-beginner",
      "google-calendar-vs-teamup-calendar-for-beginner",
      "google-calendar-vs-reclaim-ai-for-solo-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the calendar adds tasks, workspace layers, or optimization engines before a simple grid, it fails.",
    comparisonSlugs: [
      "apple-calendar-vs-motion-for-minimalist",
      "apple-calendar-vs-notion-calendar-for-minimalist",
      "clockwise-vs-google-calendar-for-minimalist",
      "google-calendar-vs-notion-calendar-for-minimalist",
    ],
  },
];

const CALENDAR_TOOL_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "apple-calendar-vs-outlook-calendar-for-beginner",
    failureMechanism: "Account and folder structure before first event.",
  },
  {
    slug: "google-calendar-vs-teamup-calendar-for-beginner",
    failureMechanism: "Shared-calendar configuration before simple scheduling.",
  },
  {
    slug: "clockwise-vs-google-calendar-for-busy-professional",
    failureMechanism: "Manual schedule optimization under time pressure.",
  },
  {
    slug: "google-calendar-vs-motion-for-busy-professional",
    failureMechanism: "Auto-rescheduling that needs oversight.",
  },
  {
    slug: "apple-calendar-vs-notion-calendar-for-solo-user",
    failureMechanism: "Workspace-linked upkeep over time.",
  },
  {
    slug: "skedda-vs-teamup-calendar-for-power-user",
    failureMechanism: "Shared calendar ceiling when resource rules matter.",
  },
  {
    slug: "google-calendar-vs-motion-for-power-user",
    failureMechanism: "Manual calendar ceiling when tasks must become time blocks.",
  },
  {
    slug: "apple-calendar-vs-motion-for-minimalist",
    failureMechanism: "Planning engine complexity instead of a simple calendar grid.",
  },
];

const CALENDAR_VS_SCHEDULING_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the tool asks you to define booking logic before you can add a meeting, it fails immediately.",
    comparisonSlugs: [
      "calendly-vs-google-calendar-for-beginner",
      "google-calendar-vs-microsoft-bookings-for-beginner",
      "google-calendar-vs-tidycal-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If all you need is to track meetings, a booking system becomes extra machinery you have to keep configured.",
    comparisonSlugs: [
      "google-calendar-vs-microsoft-bookings-for-beginner",
      "google-calendar-vs-tidycal-for-beginner",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If publishing booking pages takes more effort than just adding class events, the tool is too heavy.",
    comparisonSlugs: [
      "calendly-vs-google-calendar-for-beginner",
      "google-calendar-vs-tidycal-for-beginner",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Coordination friction breaks first here. If the tool cannot remove back-and-forth scheduling, it fails under time pressure.",
    comparisonSlugs: [
      "calendly-vs-google-calendar-for-busy-professional",
      "calendly-vs-google-calendar-for-beginner",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If you need real booking flows and the tool only stores events, the calendar caps out fast.",
    comparisonSlugs: [
      "calendly-vs-google-calendar-for-busy-professional",
      "google-calendar-vs-microsoft-bookings-for-beginner",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If services, staff, event types, or booking links feel too configurable, trust disappears.",
    comparisonSlugs: [
      "google-calendar-vs-microsoft-bookings-for-beginner",
      "google-calendar-vs-tidycal-for-beginner",
      "calendly-vs-google-calendar-for-beginner",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If you only need a calendar grid, booking layers are unnecessary drag.",
    comparisonSlugs: [
      "google-calendar-vs-tidycal-for-beginner",
      "google-calendar-vs-microsoft-bookings-for-beginner",
    ],
  },
];

const CALENDAR_VS_SCHEDULING_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "calendly-vs-google-calendar-for-beginner",
    failureMechanism: "Booking setup before simple event entry.",
  },
  {
    slug: "calendly-vs-google-calendar-for-busy-professional",
    failureMechanism: "Manual scheduling threads instead of booking links.",
  },
  {
    slug: "google-calendar-vs-microsoft-bookings-for-beginner",
    failureMechanism: "Service and staff configuration before scheduling.",
  },
  {
    slug: "google-calendar-vs-tidycal-for-beginner",
    failureMechanism: "Publishing a booking page when you only need a calendar.",
  },
];

const HELPDESK_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If support requires building a full helpdesk before you can answer a message, the tool is too heavy.",
    comparisonSlugs: [
      "groove-vs-salesforce-service-cloud-for-non-technical-user",
      "hiver-vs-zendesk-for-minimalist",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the support system makes you run infrastructure or maintain a complex stack alone, it becomes a burden.",
    comparisonSlugs: [
      "chatwoot-vs-intercom-for-solo-user",
      "hiver-vs-zendesk-for-minimalist",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If support requires a fully structured helpdesk before there is real volume, the system is overbuilt.",
    comparisonSlugs: [
      "hiver-vs-zendesk-for-minimalist",
      "groove-vs-salesforce-service-cloud-for-non-technical-user",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Response friction breaks first here. If the tool slows triage, context, routing, or reply speed, it fails under support load.",
    comparisonSlugs: [
      "acquire-vs-zendesk-for-busy-professional",
      "dixa-vs-zendesk-for-busy-professional",
      "gorgias-vs-zendesk-for-busy-professional",
      "richpanel-vs-zendesk-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the helpdesk cannot support your real workflow model, deployment needs, or support environment, it caps out fast.",
    comparisonSlugs: [
      "freshservice-vs-zendesk-for-power-user",
      "helpshift-vs-zendesk-for-power-user",
      "deskpro-vs-freshdesk-for-power-user",
      "teamsupport-vs-zendesk-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the support tool feels easy to misconfigure or too enterprise-heavy, confidence disappears.",
    comparisonSlugs: [
      "groove-vs-salesforce-service-cloud-for-non-technical-user",
      "hiver-vs-zendesk-for-minimalist",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the helpdesk pushes a whole platform when a shared inbox would do, it adds drag immediately.",
    comparisonSlugs: [
      "hiver-vs-zendesk-for-minimalist",
      "front-vs-help-scout-for-busy-professional",
    ],
  },
];

const HELPDESK_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "acquire-vs-zendesk-for-busy-professional",
    failureMechanism: "Ticket threads when the issue needs live resolution.",
  },
  {
    slug: "dixa-vs-zendesk-for-busy-professional",
    failureMechanism: "Manual triage when routing speed matters.",
  },
  {
    slug: "gorgias-vs-zendesk-for-busy-professional",
    failureMechanism: "Context switching to order data during support.",
  },
  {
    slug: "richpanel-vs-zendesk-for-busy-professional",
    failureMechanism: "Manual ticket load instead of self-service deflection.",
  },
  {
    slug: "chatwoot-vs-intercom-for-solo-user",
    failureMechanism: "Self-hosted upkeep for a solo operator.",
  },
  {
    slug: "groove-vs-salesforce-service-cloud-for-non-technical-user",
    failureMechanism: "Enterprise workflow complexity before support is even running.",
  },
  {
    slug: "freshservice-vs-zendesk-for-power-user",
    failureMechanism: "General helpdesk ceiling when IT service workflows matter.",
  },
  {
    slug: "helpshift-vs-zendesk-for-power-user",
    failureMechanism: "External support ceiling when support must live inside the app.",
  },
];

const EMAIL_INBOX_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the inbox requires installing or configuring a client before mail appears, it slows adoption immediately.",
    comparisonSlugs: [
      "gmail-vs-mailbird-for-beginner",
      "gmail-vs-postbox-for-beginner",
      "gmail-vs-thunderbird-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If your inbox needs constant rules, cleanup, or self-managed complexity to stay usable, it becomes another chore.",
    comparisonSlugs: [
      "gmail-vs-hey-for-minimalist",
      "fastmail-vs-hey-for-minimalist",
      "gmail-vs-thunderbird-for-beginner",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the inbox asks for payment or heavy commitment when you just need email for classes, it is overbuilt.",
    comparisonSlugs: [
      "gmail-vs-hey-for-student",
      "gmail-vs-superhuman-for-student",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If the inbox slows team coordination, prioritization, or response speed, it fails under load.",
    comparisonSlugs: [
      "front-vs-gmail-for-busy-professional",
      "missive-vs-thunderbird-for-busy-professional",
      "apple-mail-vs-hiver-for-busy-professional",
      "gmail-vs-hey-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the inbox cannot support deep rules, hosting control, extensions, or keyboard-heavy workflows, it caps out fast.",
    comparisonSlugs: [
      "mailbird-vs-mailmate-for-power-user",
      "mailmate-vs-spark-mail-for-power-user",
      "gmail-vs-roundcube-for-power-user",
      "proton-mail-vs-thunderbird-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If privacy or filtering requires hidden technical decisions, confidence drops quickly.",
    comparisonSlugs: [
      "icloud-mail-vs-tutanota-for-non-technical-user",
      "mailfence-vs-yahoo-mail-for-non-technical-user",
      "gmail-vs-thunderbird-for-beginner",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the inbox adds ads, clutter, or ongoing sorting work before you can just read mail, it fails.",
    comparisonSlugs: [
      "gmail-vs-hey-for-minimalist",
      "fastmail-vs-yahoo-mail-for-minimalist",
      "hey-vs-yahoo-mail-for-minimalist",
      "proton-mail-vs-yahoo-mail-for-minimalist",
    ],
  },
];

const EMAIL_INBOX_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "gmail-vs-thunderbird-for-beginner",
    failureMechanism: "Client setup before first inbox access.",
  },
  {
    slug: "front-vs-gmail-for-busy-professional",
    failureMechanism: "Shared-inbox coordination breaks inside a personal inbox.",
  },
  {
    slug: "missive-vs-thunderbird-for-busy-professional",
    failureMechanism: "Account switching and no true team view under load.",
  },
  {
    slug: "gmail-vs-hey-for-busy-professional",
    failureMechanism: "Inbox noise because sender screening happens too late.",
  },
  {
    slug: "gmail-vs-superhuman-for-student",
    failureMechanism: "Subscription commitment for a short-term email need.",
  },
  {
    slug: "icloud-mail-vs-tutanota-for-non-technical-user",
    failureMechanism: "Security confidence breaks when protection is not automatic.",
  },
  {
    slug: "mailbird-vs-mailmate-for-power-user",
    failureMechanism: "Workflow ceiling when keyboard control and rules matter.",
  },
  {
    slug: "fastmail-vs-yahoo-mail-for-minimalist",
    failureMechanism: "Ad clutter inside the inbox view.",
  },
];

const FILE_STORAGE_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If getting files online requires understanding sync models or server concepts, the tool is already too heavy.",
    comparisonSlugs: [
      "google-drive-vs-mega-for-student",
      "dropbox-vs-nextcloud-for-solo-user",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If file protection depends on constant folder management or server upkeep, it becomes a burden.",
    comparisonSlugs: [
      "backblaze-vs-dropbox-for-solo-user",
      "dropbox-vs-icloud-drive-for-solo-user",
      "dropbox-vs-nextcloud-for-solo-user",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If classmates cannot collaborate instantly, the storage tool becomes friction instead of infrastructure.",
    comparisonSlugs: [
      "google-drive-vs-mega-for-student",
      "dropbox-vs-icloud-drive-for-solo-user",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If sharing, permissions, or workflow fit require cleanup every time, the tool fails under load.",
    comparisonSlugs: [
      "box-vs-dropbox-for-busy-professional",
      "box-vs-google-drive-for-busy-professional",
      "box-vs-onedrive-for-busy-professional",
      "onedrive-vs-sync-com-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If you need stronger control, infrastructure ownership, or exact file governance, the simple sync layer caps out fast.",
    comparisonSlugs: [
      "dropbox-vs-nextcloud-for-solo-user",
      "box-vs-dropbox-for-busy-professional",
      "box-vs-google-drive-for-busy-professional",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If sharing links can stay open too long or the system asks for infrastructure decisions, confidence drops immediately.",
    comparisonSlugs: [
      "box-vs-dropbox-for-non-technical-user",
      "dropbox-vs-nextcloud-for-solo-user",
      "dropbox-vs-icloud-drive-for-solo-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the storage tool keeps expanding into a bigger workspace instead of just storing files, it adds drag.",
    comparisonSlugs: [
      "dropbox-vs-google-drive-for-minimalist",
      "backblaze-vs-dropbox-for-solo-user",
    ],
  },
];

const FILE_STORAGE_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "backblaze-vs-dropbox-for-solo-user",
    failureMechanism: "Manual sync management when you really need automatic backup.",
  },
  {
    slug: "dropbox-vs-nextcloud-for-solo-user",
    failureMechanism: "Self-hosted maintenance instead of managed sync.",
  },
  {
    slug: "dropbox-vs-icloud-drive-for-solo-user",
    failureMechanism: "Ecosystem lock when your devices are mixed.",
  },
  {
    slug: "google-drive-vs-mega-for-student",
    failureMechanism: "Storage without built-in collaboration.",
  },
  {
    slug: "box-vs-dropbox-for-busy-professional",
    failureMechanism: "Fast sharing that turns into permission cleanup.",
  },
  {
    slug: "box-vs-google-drive-for-busy-professional",
    failureMechanism: "Loose access control under time pressure.",
  },
  {
    slug: "box-vs-onedrive-for-busy-professional",
    failureMechanism: "Cross-organization sharing friction.",
  },
  {
    slug: "box-vs-dropbox-for-non-technical-user",
    failureMechanism: "Sensitive file links that are too easy to leave open.",
  },
];

const HABIT_TRACKER_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the tracker makes you define systems, metrics, or game rules before the first checkmark, it loses immediately.",
    comparisonSlugs: [
      "beeminder-vs-habitify-for-beginner",
      "habitica-vs-way-of-life-for-beginner",
      "habitify-vs-notion-for-beginner",
      "loop-habit-tracker-vs-strides-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If habit tracking depends on accounts, syncing, coaching, or social upkeep, it becomes one more thing to manage.",
    comparisonSlugs: [
      "coach-me-vs-loop-habit-tracker-for-solo-user",
      "habitify-vs-loop-habit-tracker-for-solo-user",
      "habitshare-vs-loop-habit-tracker-for-solo-user",
      "loop-habit-tracker-vs-productive-habit-tracker-for-solo-user",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the system takes longer to learn than the routine takes to form, it is too heavy.",
    comparisonSlugs: [
      "beeminder-vs-habitnow-for-beginner",
      "habitica-vs-way-of-life-for-beginner",
      "loop-habit-tracker-vs-strides-for-beginner",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If logging habits takes extra taps, extra apps, or extra theater, the routine falls apart.",
    comparisonSlugs: [
      "habitica-vs-habitnow-for-busy-professional",
      "habitica-vs-streaks-for-busy-professional",
      "habitify-vs-loop-habit-tracker-for-busy-professional",
      "loop-habit-tracker-vs-ticktick-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the tracker cannot enforce targets, analyze trends, sync everywhere, or fit into a larger system, it caps out.",
    comparisonSlugs: [
      "beeminder-vs-streaks-for-power-user",
      "everyday-habit-tracker-vs-strides-for-power-user",
      "habitify-vs-notion-for-power-user",
      "habitbull-vs-loop-habit-tracker-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the tracker feels like a system you can configure wrong, confidence disappears fast.",
    comparisonSlugs: [
      "habitify-vs-notion-for-beginner",
      "beeminder-vs-habitify-for-beginner",
      "habitica-vs-way-of-life-for-beginner",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the tracker adds game mechanics, cloud accounts, or task-system layers before a simple log, it fails.",
    comparisonSlugs: [
      "habitica-vs-loop-habit-tracker-for-minimalist",
      "beeminder-vs-everyday-habit-tracker-for-minimalist",
      "habitify-vs-loop-habit-tracker-for-minimalist",
      "loop-habit-tracker-vs-ticktick-for-minimalist",
    ],
  },
];

const HABIT_TRACKER_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "beeminder-vs-habitify-for-beginner",
    failureMechanism: "Goal system setup before the first habit log.",
  },
  {
    slug: "habitica-vs-way-of-life-for-beginner",
    failureMechanism: "Game mechanics instead of immediate tracking.",
  },
  {
    slug: "habitify-vs-loop-habit-tracker-for-busy-professional",
    failureMechanism: "Single-device friction when habits must follow you everywhere.",
  },
  {
    slug: "loop-habit-tracker-vs-ticktick-for-busy-professional",
    failureMechanism: "Separate habit app when routines and tasks need one workflow.",
  },
  {
    slug: "coach-me-vs-loop-habit-tracker-for-solo-user",
    failureMechanism: "Coaching and account overhead for a private routine.",
  },
  {
    slug: "beeminder-vs-streaks-for-power-user",
    failureMechanism: "Streak-only ceiling when targets must be enforced numerically.",
  },
  {
    slug: "habitify-vs-notion-for-power-user",
    failureMechanism: "Fixed habit app ceiling when habits must live inside a larger system.",
  },
  {
    slug: "habitica-vs-loop-habit-tracker-for-minimalist",
    failureMechanism: "Reward layers and quest logic instead of a clean checklist.",
  },
];

const KNOWLEDGE_MANAGEMENT_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the tool makes you learn files, syntax, or hidden structure before capturing an idea, it fails immediately.",
    comparisonSlugs: [
      "capacities-vs-logseq-for-beginner",
      "capacities-vs-obsidian-for-non-technical-user",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the system needs ongoing structural decisions just to stay usable, it becomes overhead.",
    comparisonSlugs: [
      "capacities-vs-reflect-for-minimalist",
      "reflect-vs-roam-research-for-minimalist",
      "capacities-vs-logseq-for-beginner",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the system takes longer to understand than the material is worth, it is too heavy.",
    comparisonSlugs: [
      "capacities-vs-logseq-for-beginner",
      "reflect-vs-roam-research-for-minimalist",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Capture speed breaks first here. If the tool asks for structure before the thought is saved, it loses under time pressure.",
    comparisonSlugs: [
      "logseq-vs-tana-for-busy-professional",
      "capacities-vs-logseq-for-beginner",
      "capacities-vs-reflect-for-minimalist",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the tool cannot support deeper structure without becoming fragile or slow, it caps out fast.",
    comparisonSlugs: [
      "logseq-vs-tana-for-busy-professional",
      "capacities-vs-obsidian-for-non-technical-user",
      "capacities-vs-roam-research-for-non-technical-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the tool depends on plugins, settings, or hidden behavior, confidence disappears.",
    comparisonSlugs: [
      "capacities-vs-obsidian-for-non-technical-user",
      "capacities-vs-roam-research-for-non-technical-user",
      "capacities-vs-logseq-for-beginner",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the system adds object types, blocks, or extra structural decisions before writing, it fails.",
    comparisonSlugs: [
      "capacities-vs-reflect-for-minimalist",
      "reflect-vs-roam-research-for-minimalist",
      "capacities-vs-roam-research-for-non-technical-user",
    ],
  },
];

const KNOWLEDGE_MANAGEMENT_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "capacities-vs-logseq-for-beginner",
    failureMechanism: "File and syntax overhead before first capture.",
  },
  {
    slug: "capacities-vs-obsidian-for-non-technical-user",
    failureMechanism: "Plugin-and-settings fragility instead of a ready system.",
  },
  {
    slug: "capacities-vs-roam-research-for-non-technical-user",
    failureMechanism: "Hidden block structure that makes editing feel uncertain.",
  },
  {
    slug: "capacities-vs-reflect-for-minimalist",
    failureMechanism: "Too many content types before a simple note flow.",
  },
  {
    slug: "reflect-vs-roam-research-for-minimalist",
    failureMechanism: "Block-based complexity instead of direct writing.",
  },
  {
    slug: "logseq-vs-tana-for-busy-professional",
    failureMechanism: "Structured fields slowing fast idea capture.",
  },
];

const PASSWORD_MANAGER_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the manager makes you handle vault files or sync manually before saving the first login, it loses immediately.",
    comparisonSlugs: [
      "bitwarden-vs-keepass-for-beginner",
      "keepass-vs-password-boss-for-beginner",
      "keepass-vs-pcloud-pass-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If password access depends on self-hosting or extra sync setup, it becomes a burden fast.",
    comparisonSlugs: [
      "bitwarden-vs-passbolt-for-solo-user",
      "enpass-vs-keeper-for-solo-user",
      "keepass-vs-password-boss-for-beginner",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the setup is heavier than the benefit or the manager locks you into extra commitment too early, it is overbuilt.",
    comparisonSlugs: [
      "bitwarden-vs-keepass-for-beginner",
      "keepass-vs-pcloud-pass-for-beginner",
      "keepass-vs-password-boss-for-beginner",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If the manager slows autofill, multi-device access, or shared credential access, it fails under load.",
    comparisonSlugs: [
      "1password-vs-keepass-for-busy-professional",
      "1password-vs-pass-for-busy-professional",
      "keepass-vs-proton-pass-for-busy-professional",
      "keepass-vs-teampassword-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the manager cannot be self-hosted, taken offline, or integrated into your own infrastructure, it caps out fast.",
    comparisonSlugs: [
      "1password-vs-bitwarden-for-power-user",
      "1password-vs-passbolt-for-power-user",
      "keepassxc-vs-proton-pass-for-power-user",
      "padloc-vs-vaultwarden-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If backup, syncing, or recovery depends on handling files correctly, confidence disappears quickly.",
    comparisonSlugs: [
      "bitwarden-vs-keepassxc-for-non-technical-user",
      "dashlane-vs-keepass-for-non-technical-user",
      "keepass-vs-logmeonce-for-non-technical-user",
      "nordpass-vs-pass-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the manager adds hosted-vault dependency, vendor accounts, or stored databases you do not want, it fails.",
    comparisonSlugs: [
      "bitwarden-vs-lesspass-for-minimalist",
      "keepass-vs-spectre-for-minimalist",
      "keepassxc-vs-1password-for-minimalist",
      "enpass-vs-nordpass-for-minimalist",
    ],
  },
];

const PASSWORD_MANAGER_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "bitwarden-vs-keepass-for-beginner",
    failureMechanism: "Vault-file setup before the first saved password.",
  },
  {
    slug: "1password-vs-pass-for-busy-professional",
    failureMechanism: "Terminal-based retrieval slowing daily login flow.",
  },
  {
    slug: "keepass-vs-teampassword-for-busy-professional",
    failureMechanism: "Manual vault sharing when teams need instant access.",
  },
  {
    slug: "dashlane-vs-keepass-for-non-technical-user",
    failureMechanism: "Recovery risk when backup depends on a local file.",
  },
  {
    slug: "keepass-vs-logmeonce-for-non-technical-user",
    failureMechanism: "Permanent lockout risk without account recovery.",
  },
  {
    slug: "1password-vs-bitwarden-for-power-user",
    failureMechanism: "Hosted-service ceiling when infrastructure control matters.",
  },
  {
    slug: "keepassxc-vs-proton-pass-for-power-user",
    failureMechanism: "Cloud dependency when the vault must work fully offline.",
  },
  {
    slug: "bitwarden-vs-lesspass-for-minimalist",
    failureMechanism: "Stored vault overhead when you want no database at all.",
  },
];

const PROJECT_MANAGEMENT_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the tool makes you learn workflows, boards, or schema before the first task, it is already too heavy.",
    comparisonSlugs: [
      "asana-vs-todoist-for-beginner",
      "jira-vs-todoist-for-beginner",
      "microsoft-to-do-vs-smartsheet-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the project tool makes you maintain team-oriented structure when you work alone, it turns into overhead.",
    comparisonSlugs: [
      "asana-vs-things-for-solo-user",
      "asana-vs-todoist-for-solo-user",
      "microsoft-to-do-vs-smartsheet-for-beginner",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the tool demands formal project structure before simple coursework tracking, it is more system than you need.",
    comparisonSlugs: [
      "asana-vs-todoist-for-beginner",
      "jira-vs-todoist-for-beginner",
      "microsoft-to-do-vs-smartsheet-for-beginner",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If ownership, status, or repeated workflow steps are hard to see and act on, the tool fails under load.",
    comparisonSlugs: [
      "asana-vs-todoist-for-busy-professional",
      "process-street-vs-trello-for-busy-professional",
      "clickup-vs-microsoft-project-for-busy-professional",
      "bonsai-vs-trello-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the tool cannot model your workflow as a real system, plan, or engineering process, it caps out fast.",
    comparisonSlugs: [
      "airtable-vs-trello-for-power-user",
      "basecamp-vs-forecast-for-power-user",
      "github-projects-vs-trello-for-power-user",
      "openproject-vs-teamwork-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If a small change can distort the workflow or schedule, the tool stops feeling safe to use.",
    comparisonSlugs: [
      "clickup-vs-todoist-for-non-technical-user",
      "microsoft-project-vs-todoist-for-non-technical-user",
      "notion-vs-project-co-for-non-technical-user",
      "mondaycom-vs-ticktick-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the tool adds hierarchy, workflow states, or planning surfaces before basic task movement, it fails.",
    comparisonSlugs: [
      "clickup-vs-todoist-for-minimalist",
      "jira-vs-trello-for-minimalist",
      "microsoft-project-vs-todoist-for-minimalist",
      "clickup-vs-things-for-minimalist",
    ],
  },
];

const PROJECT_MANAGEMENT_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "asana-vs-todoist-for-beginner",
    failureMechanism: "Project structure before simple task capture.",
  },
  {
    slug: "asana-vs-todoist-for-busy-professional",
    failureMechanism: "Ownership ambiguity when work is shared across a team.",
  },
  {
    slug: "process-street-vs-trello-for-busy-professional",
    failureMechanism: "Manual project repetition when workflows should be reusable.",
  },
  {
    slug: "clickup-vs-microsoft-project-for-busy-professional",
    failureMechanism: "Timeline upkeep instead of automatic schedule adjustment.",
  },
  {
    slug: "airtable-vs-trello-for-power-user",
    failureMechanism: "Board ceiling when work needs fields, relations, and multiple views.",
  },
  {
    slug: "basecamp-vs-forecast-for-power-user",
    failureMechanism: "Loose dates when the schedule must behave like a plan.",
  },
  {
    slug: "github-projects-vs-trello-for-power-user",
    failureMechanism: "Project tracking detached from the codebase.",
  },
  {
    slug: "microsoft-project-vs-todoist-for-non-technical-user",
    failureMechanism: "Dependency chains that make simple edits feel risky.",
  },
];

const READ_IT_LATER_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If saving the first article requires tagging systems or server decisions, the app already lost.",
    comparisonSlugs: [
      "goodlinks-vs-pinboard-for-beginner",
      "raindropio-vs-wallabag-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If your reading system needs hosting or upkeep before you can just save and read, it becomes a burden.",
    comparisonSlugs: [
      "goodlinks-vs-wallabag-for-solo-user",
      "raindropio-vs-wallabag-for-beginner",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the tool turns quick reading into a research workflow, it is more structure than you need.",
    comparisonSlugs: [
      "instapaper-vs-zotero-for-student",
      "goodlinks-vs-pinboard-for-beginner",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If you have to save manually, switch apps, or fight review layers just to clear reading, the tool fails.",
    comparisonSlugs: [
      "feedly-vs-instapaper-for-busy-professional",
      "inoreader-vs-pocket-for-busy-professional",
      "feedbin-vs-instapaper-for-busy-professional",
      "instapaper-vs-readwise-reader-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the app cannot archive, annotate, or move reading into a broader knowledge workflow, it caps out fast.",
    comparisonSlugs: [
      "archivebox-vs-instapaper-for-power-user",
      "omnivore-vs-pocket-for-power-user",
      "obsidian-web-clipper-vs-pocket-for-power-user",
      "diigo-vs-raindropio-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the app asks you to organize everything or manage a system instead of opening a reading queue, confidence drops quickly.",
    comparisonSlugs: [
      "matter-read-it-later-app-vs-raindropio-for-non-technical-user",
      "goodlinks-vs-pinboard-for-beginner",
      "raindropio-vs-wallabag-for-beginner",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the app feels like managing content instead of reading it, it fails.",
    comparisonSlugs: [
      "goodlinks-vs-pocket-for-minimalist",
      "instapaper-vs-matter-read-it-later-app-for-minimalist",
      "instapaper-vs-raindropio-for-minimalist",
      "instapaper-vs-pinboard-for-minimalist",
    ],
  },
];

const READ_IT_LATER_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "goodlinks-vs-pinboard-for-beginner",
    failureMechanism: "Tagging overhead before the first saved article.",
  },
  {
    slug: "raindropio-vs-wallabag-for-beginner",
    failureMechanism: "Self-hosting decisions before simple saving.",
  },
  {
    slug: "feedly-vs-instapaper-for-busy-professional",
    failureMechanism: "Manual saving when content should arrive automatically.",
  },
  {
    slug: "feedbin-vs-instapaper-for-busy-professional",
    failureMechanism: "Source-to-reader app switching in the daily flow.",
  },
  {
    slug: "instapaper-vs-readwise-reader-for-busy-professional",
    failureMechanism: "Review layers slowing down simple reading throughput.",
  },
  {
    slug: "archivebox-vs-instapaper-for-power-user",
    failureMechanism: "Hosted reading queue ceiling when permanent archive matters.",
  },
  {
    slug: "omnivore-vs-pocket-for-power-user",
    failureMechanism: "Read-only queue ceiling when highlights must become reusable knowledge.",
  },
  {
    slug: "instapaper-vs-zotero-for-student",
    failureMechanism: "Research-library overhead when you only need to read.",
  },
];

const SCHEDULING_BOOKING_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the tool asks for services, payments, or business structure before you can share a booking link, it is already too heavy.",
    comparisonSlugs: [
      "calendly-vs-doodle-for-beginner",
      "calendly-vs-square-appointments-for-beginner",
      "calendly-vs-zoho-bookings-for-beginner",
      "tidycal-vs-zoho-bookings-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the booking tool needs ongoing routing logic, organization settings, or recurring cleanup, it becomes a burden.",
    comparisonSlugs: [
      "calendly-vs-microsoft-bookings-for-solo-user",
      "calcom-vs-chili-piper-for-solo-user",
      "oncehub-vs-square-appointments-for-solo-user",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the setup is heavier than the temporary scheduling need, the tool is overbuilt.",
    comparisonSlugs: [
      "calendly-vs-doodle-for-student",
      "doodle-vs-tidycal-for-student",
      "calendly-vs-microsoft-bookings-for-student",
      "doodle-vs-oncehub-for-student",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If sending a link, routing meetings, or handling repeat bookings takes extra steps, the tool fails under load.",
    comparisonSlugs: [
      "cal-com-vs-calendly-for-busy-professional",
      "calendly-vs-chili-piper-for-busy-professional",
      "chili-piper-vs-doodle-for-busy-professional",
      "setmore-vs-tidycal-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the tool cannot handle custom routing, self-hosting, checkout, or invitee-side friction reduction, it caps out fast.",
    comparisonSlugs: [
      "cal-com-vs-calendly-for-power-user",
      "chili-piper-vs-oncehub-for-power-user",
      "calendly-vs-square-appointments-for-power-user",
      "calendly-vs-savvycal-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the booking flow feels like a system to configure instead of a simple way to pick a time, confidence drops quickly.",
    comparisonSlugs: [
      "calcom-vs-doodle-for-non-technical-user",
      "calendly-vs-doodle-for-beginner",
      "calendly-vs-zoho-bookings-for-beginner",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If all you need is to settle on a time, full booking infrastructure is unnecessary drag.",
    comparisonSlugs: [
      "doodle-vs-savvycal-for-minimalist",
      "calendly-vs-doodle-for-beginner",
      "doodle-vs-tidycal-for-student",
    ],
  },
];

const SCHEDULING_BOOKING_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "calendly-vs-doodle-for-beginner",
    failureMechanism: "Polling overhead when a direct booking link should be enough.",
  },
  {
    slug: "calendly-vs-square-appointments-for-beginner",
    failureMechanism: "Payment-and-service setup before simple scheduling.",
  },
  {
    slug: "cal-com-vs-calendly-for-busy-professional",
    failureMechanism: "Infrastructure/customization decisions before the link is even live.",
  },
  {
    slug: "chili-piper-vs-doodle-for-busy-professional",
    failureMechanism: "Waiting on poll responses instead of instant booking.",
  },
  {
    slug: "setmore-vs-tidycal-for-busy-professional",
    failureMechanism: "Manual upkeep for recurring bookings.",
  },
  {
    slug: "cal-com-vs-calendly-for-power-user",
    failureMechanism: "Hosted-product ceiling when workflow control and self-hosting matter.",
  },
  {
    slug: "calendly-vs-square-appointments-for-power-user",
    failureMechanism: "Separated scheduling and checkout for paid appointments.",
  },
  {
    slug: "calendly-vs-savvycal-for-power-user",
    failureMechanism: "Invitee friction when calendar overlay should reduce scheduling drag.",
  },
];

const SPREADSHEET_DATABASE_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the tool asks you to think about hosting or schema before the first row, it is already too heavy.",
    comparisonSlugs: [
      "airtable-vs-baserow-for-beginner",
      "google-sheets-vs-grist-for-student",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the system needs ongoing structure work just to stay usable, it becomes another project instead of a tool.",
    comparisonSlugs: [
      "airtable-vs-baserow-for-beginner",
      "fibery-vs-notion-for-power-user",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the tool makes you learn schema concepts for a temporary tracking problem, it is more system than you need.",
    comparisonSlugs: [
      "google-sheets-vs-grist-for-student",
      "airtable-vs-baserow-for-beginner",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Coordination friction breaks first here. If shared work creates conflicting edits or fragile ownership, the tool fails under team pressure.",
    comparisonSlugs: [
      "clickup-vs-google-sheets-for-busy-professional",
      "airtable-vs-microsoft-excel-for-non-technical-user",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the tool cannot model structured systems without duplication, schema drift, or formula sprawl, it caps out fast.",
    comparisonSlugs: [
      "coda-vs-microsoft-excel-for-power-user",
      "directus-vs-notion-for-power-user",
      "fibery-vs-notion-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If a wrong edit can silently corrupt the system, confidence disappears quickly.",
    comparisonSlugs: [
      "airtable-vs-microsoft-excel-for-non-technical-user",
      "appsheet-vs-google-sheets-for-non-technical-user",
      "fibery-vs-google-sheets-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the tool adds relations, views, or metadata when all you need is a grid, it creates drag.",
    comparisonSlugs: [
      "airtable-vs-microsoft-excel-for-minimalist",
      "google-sheets-vs-grist-for-student",
    ],
  },
];

const SPREADSHEET_DATABASE_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "airtable-vs-baserow-for-beginner",
    failureMechanism: "Hosting/setup overhead before the first table.",
  },
  {
    slug: "google-sheets-vs-grist-for-student",
    failureMechanism: "Schema learning overhead for short-term tracking.",
  },
  {
    slug: "clickup-vs-google-sheets-for-busy-professional",
    failureMechanism: "Conflicting shared edits in an uncontrolled grid.",
  },
  {
    slug: "airtable-vs-microsoft-excel-for-non-technical-user",
    failureMechanism: "Formula fragility instead of enforced structure.",
  },
  {
    slug: "appsheet-vs-google-sheets-for-non-technical-user",
    failureMechanism: "Manual cell references breaking downstream workflows.",
  },
  {
    slug: "coda-vs-microsoft-excel-for-power-user",
    failureMechanism: "Formula-sheet ceiling when the system needs relations and workflows.",
  },
  {
    slug: "directus-vs-notion-for-power-user",
    failureMechanism: "Schema drift when strict structure matters across systems.",
  },
  {
    slug: "fibery-vs-notion-for-power-user",
    failureMechanism: "Database duplication instead of one unified data model.",
  },
];

const TEAM_COLLABORATION_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the team tool feels like admin work before the first message, it already lost.",
    comparisonSlugs: [
      "discord-vs-mattermost-for-beginner",
      "flock-vs-twist-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the collaboration tool drags in workspace overhead you do not need, it becomes dead weight.",
    comparisonSlugs: ["basecamp-vs-microsoft-teams-for-solo-user"],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the tool asks for too much setup for short-term group work, it fails.",
    comparisonSlugs: [
      "discord-vs-google-chat-for-student",
      "discord-vs-microsoft-teams-for-student",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Message overload breaks first here. If the tool slows daily coordination with noise, context switching, or heavy workspace layers, it fails fast.",
    comparisonSlugs: [
      "basecamp-vs-slack-for-busy-professional",
      "google-chat-vs-slack-for-busy-professional",
      "microsoft-teams-vs-slack-for-busy-professional",
      "discord-vs-zulip-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the tool cannot hold up under admin control, threading depth, or serious team complexity, it caps out.",
    comparisonSlugs: [
      "mattermost-vs-slack-for-power-user",
      "google-chat-vs-zulip-for-power-user",
      "microsoft-teams-vs-twist-for-power-user",
      "discord-vs-mattermost-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the workspace feels crowded, risky, or hard to understand, trust disappears.",
    comparisonSlugs: [
      "basecamp-vs-discord-for-non-technical-user",
      "basecamp-vs-microsoft-teams-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the tool turns simple team messaging into channel sprawl or interface clutter, it fails.",
    comparisonSlugs: [
      "slack-vs-twist-for-minimalist",
      "basecamp-vs-google-chat-for-minimalist",
      "google-chat-vs-twist-for-minimalist",
      "discord-vs-microsoft-teams-for-minimalist",
    ],
  },
];

const TEAM_COLLABORATION_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "discord-vs-mattermost-for-beginner",
    failureMechanism: "Setup and admin burden before the first team rhythm exists.",
  },
  {
    slug: "basecamp-vs-slack-for-busy-professional",
    failureMechanism: "Message noise that breaks focus during the workday.",
  },
  {
    slug: "discord-vs-zulip-for-busy-professional",
    failureMechanism: "Threading model that breaks under high-volume conversation.",
  },
  {
    slug: "basecamp-vs-microsoft-teams-for-solo-user",
    failureMechanism: "Workspace overhead when one person just needs coordination without upkeep.",
  },
  {
    slug: "basecamp-vs-discord-for-non-technical-user",
    failureMechanism: "Interface complexity that feels easy to misuse.",
  },
  {
    slug: "slack-vs-twist-for-minimalist",
    failureMechanism: "Too much real-time chatter when calmer async communication matters.",
  },
  {
    slug: "mattermost-vs-slack-for-power-user",
    failureMechanism: "Hosted convenience ceiling when control and admin depth matter.",
  },
  {
    slug: "google-chat-vs-zulip-for-power-user",
    failureMechanism: "Shallow team structure when conversation organization has to scale.",
  },
];

const TIME_TRACKING_PERSONAS: DecisionPersona[] = [
  {
    name: "Beginner",
    explanation:
      "Setup breaks first here. If the tool makes you configure billing, teams, or reporting before you start one timer, it already lost.",
    comparisonSlugs: [
      "accountsight-vs-clockify-for-beginner",
      "clockify-vs-journyx-for-beginner",
      "clockify-vs-replicon-for-beginner",
      "officetime-vs-toggl-track-for-beginner",
    ],
  },
  {
    name: "Solo user",
    explanation:
      "Maintenance breaks first here. If the tracker needs constant cleanup, subscriptions, or admin care just to keep logging time, it becomes another chore.",
    comparisonSlugs: [
      "activitywatch-vs-clockify-for-solo-user",
      "activitywatch-vs-rescuetime-for-solo-user",
      "clockify-vs-manictime-for-solo-user",
      "activitywatch-vs-timely-for-solo-user",
    ],
  },
  {
    name: "Student",
    explanation:
      "Switching cost breaks first here. If the tool asks for more setup than the class or short project lasts, it fails.",
    comparisonSlugs: [
      "atracker-vs-kimai-for-student",
      "buddy-punch-vs-harvest-for-student",
    ],
  },
  {
    name: "Busy professional",
    explanation:
      "Daily friction breaks first here. If starting timers, correcting entries, or feeding a heavier workflow slows the day down, the tool loses.",
    comparisonSlugs: [
      "clockify-vs-rescuetime-for-busy-professional",
      "everhour-vs-timeular-for-busy-professional",
      "paymo-track-vs-toggl-track-for-busy-professional",
      "accelo-vs-timely-for-busy-professional",
    ],
  },
  {
    name: "Power user",
    explanation:
      "Ceiling breaks first here. If the tracker caps out on control, reporting depth, automation, or data ownership, it fails later but harder.",
    comparisonSlugs: [
      "clockify-vs-kimai-for-power-user",
      "timely-vs-timingapp-for-power-user",
      "timing-time-tracking-app-vs-toggl-track-for-power-user",
      "intervals-vs-timedoctor-for-power-user",
    ],
  },
  {
    name: "Non-technical user",
    explanation:
      "Fear of breaking things breaks first here. If the tool feels knob-heavy, easy to misconfigure, or structurally confusing, trust disappears.",
    comparisonSlugs: [
      "clockify-vs-timepanic-for-non-technical-user",
      "harvest-vs-kimai-for-non-technical-user",
      "paymo-vs-replicon-for-non-technical-user",
      "trackingtime-vs-zoho-projects-for-non-technical-user",
    ],
  },
  {
    name: "Minimalist",
    explanation:
      "Feature weight breaks first here. If the tool wraps simple time capture in project suite overhead, planning layers, or extra rituals, it fails.",
    comparisonSlugs: [
      "accelo-vs-toggl-track-for-minimalist",
      "clockify-vs-timely-for-minimalist",
      "activitywatch-vs-rescuetime-for-minimalist",
      "ora-vs-toggl-track-for-minimalist",
    ],
  },
];

const TIME_TRACKING_TOP_COMPARISONS: TopComparison[] = [
  {
    slug: "accountsight-vs-clockify-for-beginner",
    failureMechanism: "Setup overhead before the first usable timer.",
  },
  {
    slug: "clockify-vs-rescuetime-for-busy-professional",
    failureMechanism: "Manual timer friction when passive capture would save the day.",
  },
  {
    slug: "activitywatch-vs-rescuetime-for-solo-user",
    failureMechanism: "Ongoing maintenance and service dependence over time.",
  },
  {
    slug: "harvest-vs-kimai-for-non-technical-user",
    failureMechanism: "Self-hosted or admin-heavy complexity that feels easy to break.",
  },
  {
    slug: "accelo-vs-toggl-track-for-minimalist",
    failureMechanism: "Too much business system before simple time capture.",
  },
  {
    slug: "paymo-track-vs-toggl-track-for-busy-professional",
    failureMechanism: "Extra workflow layers slowing down daily logging.",
  },
  {
    slug: "clockify-vs-kimai-for-power-user",
    failureMechanism: "Simplicity ceiling when control and ownership matter more.",
  },
  {
    slug: "timely-vs-timingapp-for-power-user",
    failureMechanism: "Automation style that breaks when deeper control is the real requirement.",
  },
];

function renderTaskManagersHub() {
  const personas = buildPersonaSituationCards(TASK_MANAGER_PERSONAS, "task-managers");
  const topComparisons = buildTopComparisonCards(TASK_MANAGER_TOP_COMPARISONS);

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
            Most task managers fail when the system gets in the way of the
            task. What breaks first is usually setup, daily friction, upkeep,
            switching cost, fragility, or ceiling.
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
            <li>If setup friction is the thing that will kill adoption -&gt; Apple Reminders</li>
            <li>If daily speed is the thing that will kill consistency -&gt; Todoist</li>
            <li>If you need board structure without enterprise drag -&gt; Trello</li>
            <li>If GTD depth is the thing that will cap you -&gt; OmniFocus</li>
            <li>If engineering workflow structure is the thing that matters -&gt; Jira</li>
            <li>If dependency visibility is the thing that will break planning -&gt; Taskheat</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("task-managers")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the tool that does not break first under your constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the constraint that will create friction fastest for you:
            setup, upkeep, speed, switching cost, fragility, or ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that failure mechanism is tested most
            directly. The right click is the one that gets you to the first real
            break point fastest.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderNoteTakingAppsHub() {
  const personas = buildPersonaSituationCards(NOTE_TAKING_PERSONAS, "note-taking-apps");
  const topComparisons = buildTopComparisonCards(NOTE_TAKING_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Note-taking apps
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most note-taking apps fail when the system gets between you and the
            note. What breaks first is usually setup, daily capture speed,
            upkeep, sync confidence, or ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not fail first under that pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the thing that will stop you writing -&gt; Apple Notes</li>
            <li>If instant capture is the thing that matters most -&gt; Google Keep</li>
            <li>If short-term collaboration is the thing that matters most -&gt; Google Docs</li>
            <li>If low-maintenance personal notes are the thing that matters most -&gt; Apple Notes</li>
            <li>If extensibility ceiling is the thing that matters most -&gt; Obsidian</li>
            <li>If interface weight is the thing that will kill focus -&gt; Bear</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("note-taking-apps")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the note app that does not fail first under your constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up fastest for you: setup,
            speed, upkeep, sync confidence, simplicity, or ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that failure is tested most directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderBookmarkManagersHub() {
  const personas = buildPersonaSituationCards(BOOKMARK_MANAGER_PERSONAS, "bookmark-managers");
  const topComparisons = buildTopComparisonCards(BOOKMARK_MANAGER_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Bookmark Managers
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most bookmark managers fail when saving is slower than the link, or
            when finding it again depends on too much manual structure.
          </p>
          <p className="text-base leading-7 text-black/80">
            The right choice depends on what breaks first for you: setup, daily
            retrieval speed, confidence, or ceiling.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the thing that will stop you saving links -&gt; Pinboard</li>
            <li>If fast visual scanning is the thing that matters most -&gt; Raindrop.io</li>
            <li>If search has to beat manual tagging -&gt; Historious</li>
            <li>If links need to resurface without manual refinding -&gt; Refind</li>
            <li>If full-page archival is the thing that matters most -&gt; ArchiveBox</li>
            <li>If simple offline reading is the thing that matters most -&gt; GoodLinks</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("bookmark-managers")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the bookmark tool that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up fastest: saving speed,
            retrieval friction, setup risk, simplicity, or archival ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that failure mechanism is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderCalendarToolsHub() {
  const personas = buildPersonaSituationCards(CALENDAR_TOOL_PERSONAS, "calendar-tools");
  const topComparisons = buildTopComparisonCards(CALENDAR_TOOL_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Calendar Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most calendar tools fail when scheduling becomes harder than the
            event itself. What breaks first is usually setup, daily scan speed,
            automation overhead, or ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the calendar that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the thing that will stop adoption -&gt; Google Calendar</li>
            <li>If you want a simple schedule with minimal interface weight -&gt; Apple Calendar</li>
            <li>If fragmented meetings are the thing killing your day -&gt; Clockwise</li>
            <li>If task scheduling has to happen automatically -&gt; Motion</li>
            <li>If your work already lives in task apps and must land on the calendar -&gt; Akiflow</li>
            <li>If booking rules for rooms or resources are the real constraint -&gt; Skedda</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("calendar-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the calendar that does not fail first under your constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up fastest: setup, daily scan
            speed, automation overhead, simplicity, or scheduling ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that failure mechanism is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderCalendarVsSchedulingToolsHub() {
  const personas = buildPersonaSituationCards(
    CALENDAR_VS_SCHEDULING_PERSONAS,
    "calendar-vs-scheduling-tools"
  );
  const topComparisons = buildTopComparisonCards(CALENDAR_VS_SCHEDULING_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Calendar vs Scheduling Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            This category breaks on one question: do you need to track time, or
            do you need other people to book time with you?
          </p>
          <p className="text-base leading-7 text-black/80">
            The wrong tool fails when it forces booking setup before simple
            scheduling, or when it leaves you stuck in manual scheduling loops.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If you only need to add and view events -&gt; Google Calendar</li>
            <li>If back-and-forth scheduling is the thing wasting time -&gt; Calendly</li>
            <li>If booking-page setup would kill adoption -&gt; Google Calendar</li>
            <li>If you need a real booking system instead of a plain calendar -&gt; Microsoft Bookings</li>
            <li>If you want the lightest path from calendar to booking link -&gt; Calendly</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("calendar-vs-scheduling-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the tool that does not fail first under your constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            If your problem is tracking time on a calendar, use the tool that
            lets you schedule immediately. If your problem is getting other
            people to choose a slot, use the tool that removes manual booking
            back-and-forth.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderHelpdeskToolsHub() {
  const personas = buildPersonaSituationCards(
    HELPDESK_PERSONAS,
    "customer-support-helpdesk-tools"
  );
  const topComparisons = buildTopComparisonCards(HELPDESK_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Customer Support / Helpdesk Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most support tools fail when the system slows resolution instead of
            speeding it up. What breaks first is usually triage speed, context
            access, support volume, maintenance burden, or workflow ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not fail first under that support
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If live problem-solving is the thing that matters most -&gt; Acquire</li>
            <li>If routing speed across channels is the thing that matters most -&gt; Dixa</li>
            <li>If support depends on instant order context -&gt; Gorgias</li>
            <li>If self-service deflection is the thing reducing team load -&gt; Richpanel</li>
            <li>If you need the lightest shared-inbox path -&gt; Hiver</li>
            <li>If IT service workflows are the real constraint -&gt; Freshservice</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("customer-support-helpdesk-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the support tool that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up first: reply speed,
            routing, missing context, support volume, maintenance, or workflow
            depth.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderEmailInboxToolsHub() {
  const personas = buildPersonaSituationCards(EMAIL_INBOX_PERSONAS, "email-inbox-tools");
  const topComparisons = buildTopComparisonCards(EMAIL_INBOX_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Email / Inbox Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most inbox tools fail when email management takes more work than the
            messages themselves. What breaks first is usually setup, inbox
            noise, coordination friction, clutter, or workflow ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the inbox that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the thing that will stop adoption -&gt; Gmail</li>
            <li>If sender screening is the thing that will save your attention -&gt; HEY</li>
            <li>If team inbox coordination is the thing that matters most -&gt; Front</li>
            <li>If shared replies need comments and real collaboration -&gt; Missive</li>
            <li>If privacy should work without extra decisions -&gt; Tutanota</li>
            <li>If keyboard-driven workflow depth is the real constraint -&gt; MailMate</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("email-inbox-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the inbox that does not fail first under your constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that shows up first: setup, noise, team
            coordination, privacy confidence, simplicity, or workflow depth.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderFileStorageToolsHub() {
  const personas = buildPersonaSituationCards(
    FILE_STORAGE_PERSONAS,
    "file-storage-cloud-storage-tools"
  );
  const topComparisons = buildTopComparisonCards(FILE_STORAGE_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          File Storage / Cloud Storage Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most storage tools fail when protecting or sharing files takes more
            work than the files themselves. What breaks first is usually
            maintenance, collaboration friction, permission control, ecosystem
            fit, or control ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the storage tool that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If automatic backup is the thing that matters most -&gt; Backblaze</li>
            <li>If collaboration has to work immediately -&gt; Google Drive</li>
            <li>If permission control is the thing that matters most -&gt; Box</li>
            <li>If cross-platform sync is the thing that matters most -&gt; Dropbox</li>
            <li>If you want storage without leaving Microsoft 365 -&gt; OneDrive</li>
            <li>If you want managed storage without self-hosting burden -&gt; Dropbox</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("file-storage-cloud-storage-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the storage tool that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up first: maintenance,
            sharing control, collaboration speed, ecosystem fit, or control
            ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderHabitTrackersHub() {
  const personas = buildPersonaSituationCards(HABIT_TRACKER_PERSONAS, "habit-trackers");
  const topComparisons = buildTopComparisonCards(HABIT_TRACKER_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Habit Trackers
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most habit trackers fail when tracking the habit becomes harder than
            doing the habit. What breaks first is usually setup, daily logging
            friction, maintenance, feature weight, or ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tracker that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the thing that will kill adoption -&gt; Habitify</li>
            <li>If you want the simplest private habit tracker -&gt; Loop Habit Tracker</li>
            <li>If game mechanics would get in the way -&gt; Way of Life</li>
            <li>If habits must sync cleanly across devices -&gt; Habitify</li>
            <li>If habits need hard numeric enforcement -&gt; Beeminder</li>
            <li>If habits must plug into a larger custom system -&gt; Notion</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("habit-trackers")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the habit tracker that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up first: setup, logging
            speed, maintenance, simplicity, or system ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderKnowledgeManagementToolsHub() {
  const personas = buildPersonaSituationCards(
    KNOWLEDGE_MANAGEMENT_PERSONAS,
    "knowledge-management-tools"
  );
  const topComparisons = buildTopComparisonCards(KNOWLEDGE_MANAGEMENT_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Knowledge Management Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most knowledge management tools fail when the system gets between
            you and the thought. What breaks first is usually setup, structural
            friction, editing predictability, or simplicity.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the thing that will kill adoption -&gt; Capacities</li>
            <li>If writing must stay simple and unified -&gt; Reflect</li>
            <li>If you need local-first capture without schema overhead -&gt; Logseq</li>
            <li>If plugins and hidden settings would make the system feel fragile -&gt; Capacities</li>
            <li>If block-heavy structure would slow thinking -&gt; Reflect</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("knowledge-management-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the knowledge tool that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up first: setup, capture
            speed, editing predictability, simplicity, or structural overhead.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderPasswordManagersHub() {
  const personas = buildPersonaSituationCards(PASSWORD_MANAGER_PERSONAS, "password-managers");
  const topComparisons = buildTopComparisonCards(PASSWORD_MANAGER_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Password Managers
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most password managers fail when safety depends on extra work from
            the user. What breaks first is usually setup, sync friction,
            recovery confidence, daily login speed, or control ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the manager that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the thing that will stop adoption -&gt; Bitwarden</li>
            <li>If multi-device sync has to work automatically -&gt; 1Password</li>
            <li>If team sharing is the thing that matters most -&gt; TeamPassword</li>
            <li>If recovery confidence is the thing that matters most -&gt; Dashlane</li>
            <li>If full infrastructure control is the real constraint -&gt; Passbolt</li>
            <li>If you want a fully offline portable vault -&gt; KeePassXC</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("password-managers")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the password manager that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up first: setup, recovery,
            sync, daily login speed, simplicity, or control ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderProjectManagementToolsHub() {
  const personas = buildPersonaSituationCards(
    PROJECT_MANAGEMENT_PERSONAS,
    "project-management-tools"
  );
  const topComparisons = buildTopComparisonCards(PROJECT_MANAGEMENT_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Project Management Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most project tools fail when managing the system becomes harder than
            moving the work. What breaks first is usually setup, daily
            coordination friction, structural fragility, or ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the thing that will kill adoption -&gt; Todoist</li>
            <li>If team ownership visibility is the thing that matters most -&gt; Asana</li>
            <li>If projects must run as repeatable workflows -&gt; Process Street</li>
            <li>If the schedule must behave like a real plan -&gt; Forecast</li>
            <li>If the work must live beside the code -&gt; GitHub Projects</li>
            <li>If the system must model work as structured data -&gt; Airtable</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("project-management-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the project tool that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that will show up first: setup, ownership
            clarity, workflow repetition, scheduling depth, code adjacency, or
            system ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderReadItLaterAppsHub() {
  const personas = buildPersonaSituationCards(READ_IT_LATER_PERSONAS, "read-it-later-apps");
  const topComparisons = buildTopComparisonCards(READ_IT_LATER_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Read-It-Later Apps
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most read-it-later apps fail when managing the reading system takes
            more energy than reading the article. What breaks first is usually
            save friction, app switching, maintenance, or reuse ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the app that does not fail first under that pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If simple tap-to-save is the thing that matters most -&gt; GoodLinks</li>
            <li>If content should come to you automatically -&gt; Feedly</li>
            <li>If you want the cleanest reading queue -&gt; Instapaper</li>
            <li>If saved reading must turn into reusable knowledge -&gt; Omnivore</li>
            <li>If permanent web archiving is the real constraint -&gt; ArchiveBox</li>
            <li>If you want a guided reading queue instead of an organization system -&gt; Matter</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("read-it-later-apps")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the read-it-later app that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that shows up first: saving speed, reading
            throughput, maintenance, organizational overhead, or reuse ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderSchedulingBookingToolsHub() {
  const personas = buildPersonaSituationCards(
    SCHEDULING_BOOKING_PERSONAS,
    "scheduling-booking-tools"
  );
  const topComparisons = buildTopComparisonCards(SCHEDULING_BOOKING_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Scheduling / Booking Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most scheduling tools fail when booking the time becomes harder than
            the meeting itself. What breaks first is usually setup, routing
            friction, recurring upkeep, or booking-system ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If you need the fastest simple booking link -&gt; Calendly</li>
            <li>If you just need to coordinate availability without a booking system -&gt; Doodle</li>
            <li>If recurring client bookings are the thing that matter most -&gt; Setmore</li>
            <li>If meeting ownership must be routed dynamically -&gt; Chili Piper</li>
            <li>If workflow control and self-hosting are the real constraint -&gt; Cal.com</li>
            <li>If paid appointments must include checkout in the same flow -&gt; Square Appointments</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("scheduling-booking-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the scheduling tool that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that shows up first: setup, booking speed,
            routing, recurring upkeep, payment flow, or customization ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderSpreadsheetDatabaseToolsHub() {
  const personas = buildPersonaSituationCards(
    SPREADSHEET_DATABASE_PERSONAS,
    "spreadsheet-database-tools"
  );
  const topComparisons = buildTopComparisonCards(SPREADSHEET_DATABASE_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Spreadsheet / Database Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most spreadsheet and database tools fail when the structure is too
            fragile or too heavy for the job. What breaks first is usually
            setup, shared-edit reliability, formula fragility, or system
            ceiling.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If you need the fastest hosted path to structured tables -&gt; Airtable</li>
            <li>If you just need a flat grid with minimal overhead -&gt; Microsoft Excel</li>
            <li>If shared work must not break under conflicting edits -&gt; ClickUp</li>
            <li>If formula fragility is the thing you cannot tolerate -&gt; Airtable</li>
            <li>If the system must enforce strict schema across tools -&gt; Directus</li>
            <li>If the system needs one unified data model -&gt; Fibery</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("spreadsheet-database-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the spreadsheet or database tool that does not fail first
            under your constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that shows up first: setup, edit safety,
            formula fragility, simplicity, or system ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderTeamCollaborationToolsHub() {
  const personas = buildPersonaSituationCards(
    TEAM_COLLABORATION_PERSONAS,
    "team-collaboration-tools"
  );
  const topComparisons = buildTopComparisonCards(TEAM_COLLABORATION_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Team Collaboration Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most team collaboration tools fail when coordination turns into
            noise, admin work, or interface clutter. What breaks first is
            usually setup, message overload, simplicity, or ceiling under team
            complexity.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the first thing you will reject -&gt; Flock</li>
            <li>If daily message overload is what breaks work first -&gt; Basecamp</li>
            <li>If you want the simplest calm async communication -&gt; Twist</li>
            <li>If your team needs organized conversation that scales -&gt; Zulip</li>
            <li>If control and admin depth matter more than hosted convenience -&gt; Mattermost</li>
            <li>If short-term group chat with low switching cost matters -&gt; Discord</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("team-collaboration-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the collaboration tool that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that shows up first: setup, message noise,
            complexity, coordination style, or admin ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
          </p>
        </Card>
      </section>
    </main>
  );
}

function renderTimeTrackingToolsHub() {
  const personas = buildPersonaSituationCards(TIME_TRACKING_PERSONAS, "time-tracking-tools");
  const topComparisons = buildTopComparisonCards(TIME_TRACKING_TOP_COMPARISONS);

  return (
    <main className="site-container page-shell content-stack">
      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Time Tracking Tools
        </h1>
      </header>

      <section className="content-stack gap-4">
        <SectionHeading title="One-Second Verdict" />
        <Card className="space-y-3">
          <p className="text-base leading-7 text-black/80">
            Most time tracking tools fail when logging time takes too much
            effort or the system grows heavier than the work. What breaks first
            is usually setup, daily timer friction, maintenance, complexity, or
            ceiling under reporting and control.
          </p>
          <p className="text-base leading-7 text-black/80">
            The winner is the tool that does not fail first under that
            pressure.
          </p>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Quick Decision" />
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-black/80">
            <li>If setup friction is the first thing you will reject -&gt; Clockify</li>
            <li>If daily manual timer starts are what break the habit -&gt; ActivityWatch</li>
            <li>If client billing must stay tied to tracked time -&gt; Harvest</li>
            <li>If control and ownership matter more than hosted convenience -&gt; Kimai</li>
            <li>If short-term use with low switching cost matters -&gt; ATracker</li>
            <li>If feature weight is the thing you cannot tolerate -&gt; Toggl Track</li>
          </ul>
        </Card>
      </section>

      <section className="content-stack gap-4">
        <SectionHeading title="Start By Your Situation" />
        <PersonaSituationGrid personas={personas} />
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

      {renderSituationFilterSection("time-tracking-tools")}

      <section className="content-stack gap-4">
        <SectionHeading title="How To Choose" />
        <Card className="space-y-3">
          <p className="text-sm leading-6 text-black/80">
            Pick the time tracking tool that does not fail first under your
            constraint.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Start with the pressure that shows up first: setup, timer friction,
            maintenance, simplicity, or ceiling.
          </p>
          <p className="text-sm leading-6 text-black/80">
            Then open the comparison where that break point is tested most
            directly.
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

  if (categorySlug === "note-taking-apps") {
    return {
      title: "Note-taking apps",
      description:
        "Decision-first note-taking hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "bookmark-managers") {
    return {
      title: "Bookmark Managers",
      description:
        "Decision-first bookmark hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "calendar-tools") {
    return {
      title: "Calendar Tools",
      description:
        "Decision-first calendar hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "calendar-vs-scheduling-tools") {
    return {
      title: "Calendar vs Scheduling Tools",
      description:
        "Decision-first hub for choosing between plain calendars and booking tools.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "customer-support-helpdesk-tools") {
    return {
      title: "Customer Support / Helpdesk Tools",
      description:
        "Decision-first support hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "email-inbox-tools") {
    return {
      title: "Email / Inbox Tools",
      description:
        "Decision-first inbox hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "file-storage-cloud-storage-tools") {
    return {
      title: "File Storage / Cloud Storage Tools",
      description:
        "Decision-first cloud storage hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "habit-trackers") {
    return {
      title: "Habit Trackers",
      description:
        "Decision-first habit tracker hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "knowledge-management-tools") {
    return {
      title: "Knowledge Management Tools",
      description:
        "Decision-first knowledge management hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "password-managers") {
    return {
      title: "Password Managers",
      description:
        "Decision-first password manager hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "project-management-tools") {
    return {
      title: "Project Management Tools",
      description:
        "Decision-first project management hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "read-it-later-apps") {
    return {
      title: "Read-It-Later Apps",
      description:
        "Decision-first read-it-later hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "scheduling-booking-tools") {
    return {
      title: "Scheduling / Booking Tools",
      description:
        "Decision-first scheduling hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "spreadsheet-database-tools") {
    return {
      title: "Spreadsheet / Database Tools",
      description:
        "Decision-first spreadsheet and database hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "team-collaboration-tools") {
    return {
      title: "Team Collaboration Tools",
      description:
        "Decision-first team collaboration hub organized by what breaks first.",
      alternates: {
        canonical: absoluteUrl(`/${categorySlug}`),
      },
    };
  }

  if (categorySlug === "time-tracking-tools") {
    return {
      title: "Time Tracking Tools",
      description:
        "Decision-first time tracking hub organized by what breaks first.",
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

  if (categorySlug === "note-taking-apps") {
    return renderNoteTakingAppsHub();
  }

  if (categorySlug === "bookmark-managers") {
    return renderBookmarkManagersHub();
  }

  if (categorySlug === "calendar-tools") {
    return renderCalendarToolsHub();
  }

  if (categorySlug === "calendar-vs-scheduling-tools") {
    return renderCalendarVsSchedulingToolsHub();
  }

  if (categorySlug === "customer-support-helpdesk-tools") {
    return renderHelpdeskToolsHub();
  }

  if (categorySlug === "email-inbox-tools") {
    return renderEmailInboxToolsHub();
  }

  if (categorySlug === "file-storage-cloud-storage-tools") {
    return renderFileStorageToolsHub();
  }

  if (categorySlug === "habit-trackers") {
    return renderHabitTrackersHub();
  }

  if (categorySlug === "knowledge-management-tools") {
    return renderKnowledgeManagementToolsHub();
  }

  if (categorySlug === "password-managers") {
    return renderPasswordManagersHub();
  }

  if (categorySlug === "project-management-tools") {
    return renderProjectManagementToolsHub();
  }

  if (categorySlug === "read-it-later-apps") {
    return renderReadItLaterAppsHub();
  }

  if (categorySlug === "scheduling-booking-tools") {
    return renderSchedulingBookingToolsHub();
  }

  if (categorySlug === "spreadsheet-database-tools") {
    return renderSpreadsheetDatabaseToolsHub();
  }

  if (categorySlug === "team-collaboration-tools") {
    return renderTeamCollaborationToolsHub();
  }

  if (categorySlug === "time-tracking-tools") {
    return renderTimeTrackingToolsHub();
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
                  {getComparisonDisplayTitle(page.title)}
                </Link>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      {renderSituationFilterSection(category.slug)}

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
                          {getComparisonDisplayTitle(page.title)}
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
