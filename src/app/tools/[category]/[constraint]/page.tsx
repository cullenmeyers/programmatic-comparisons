import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { getCategoryGate, listCategoryGateParams } from "@/content/categoryGates";
import {
  getComparisonDisplayTitle,
  listComparisonsForGate,
  loadPageBySlug,
} from "@/lib/pages";
import { absoluteUrl } from "@/lib/site";
import CategoryGateClient from "./CategoryGateClient";

export const dynamicParams = true;

export function generateStaticParams() {
  return listCategoryGateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; constraint: string }>;
}): Promise<Metadata> {
  const { category, constraint } = await params;
  const gate = getCategoryGate(category, constraint);
  if (!gate) return { title: "Gate not found" };

  const lensName = gate.uiConstraintName ?? gate.constraintLabel;
  const filterCopy = getFilterCopy(gate.constraintSlug, gate.categoryLabel, lensName);
  const description =
    filterCopy.intro.slice(0, 2).join(" ") ||
    gate.description?.slice(0, 2).join(" ") ||
    `A deterministic decision gate for ${gate.categoryLabel} under ${gate.constraintLabel}.`;

  return {
    title: gate.title,
    description,
    alternates: {
      canonical: absoluteUrl(`/tools/${category}/${constraint}`),
    },
  };
}

function prettyFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

const EXAMPLE_TOOL_NAME_ALIASES: Record<string, string> = {
  "Reclaim.ai": "Reclaim",
  "Microsoft OneNote": "OneNote",
  "MS OneNote": "OneNote",
  "Google Cal": "Google Calendar",
  "GCal": "Google Calendar",
  Outlook: "Outlook Calendar",
  "Microsoft Outlook Calendar": "Outlook Calendar",
  "iCloud Calendar": "Apple Calendar",
  "SortedÂ³": "Sorted 3",
  "SortedÃ‚Â³": "Sorted 3",
};

const EXAMPLE_TOOL_NAME_OVERRIDES: Record<string, string> = {
  calcom: "Cal.com",
  mondaycom: "Monday.com",
  anydo: "Any.do",
  tawkto: "Tawk.to",
  raindropio: "Raindrop.io",
  reclaimai: "Reclaim",
};

function normalizeExampleToolName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "";

  const aliasMatch = EXAMPLE_TOOL_NAME_ALIASES[trimmed];
  if (aliasMatch) return aliasMatch;

  const cleaned = trimmed
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
  const compactKey = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  return EXAMPLE_TOOL_NAME_OVERRIDES[compactKey] ?? trimmed;
}

function uniqueExampleToolNames(names: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const name of names) {
    const normalized = normalizeExampleToolName(name);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

type FilterCopy = {
  intro: string[];
  startHere: string[];
  skipThis: string[];
  topFailureLine: string;
  failureExplanation: string[];
  failsHere: string;
  survivesHere: string;
};

function getTopComparisonsForSituation(
  categorySlug: string,
  constraintSlug: string,
  manualRelated: string[]
) {
  const candidateSlugs = Array.from(
    new Set([...manualRelated, ...listComparisonsForGate(categorySlug, constraintSlug)])
  );

  const candidates = candidateSlugs.flatMap((compareSlug) => {
    const doc = loadPageBySlug(compareSlug);

    if (
      !doc ||
      doc.categorySlug !== categorySlug ||
      doc.constraintSlug !== constraintSlug ||
      doc.verdict.winner === "depends"
    ) {
      return [];
    }

    return [
      {
        slug: compareSlug,
        title: getComparisonDisplayTitle(doc.title),
        persona: doc.persona,
      },
    ];
  });

  const topComparisons: typeof candidates = [];
  const seenPersonas = new Set<string>();

  for (const candidate of candidates) {
    if (seenPersonas.has(candidate.persona)) continue;
    seenPersonas.add(candidate.persona);
    topComparisons.push(candidate);
    if (topComparisons.length === 6) return topComparisons;
  }

  for (const candidate of candidates) {
    if (topComparisons.some((item) => item.slug === candidate.slug)) continue;
    topComparisons.push(candidate);
    if (topComparisons.length === 6) break;
  }

  return topComparisons;
}

function getFilterCopy(
  constraintSlug: string,
  categoryLabel: string,
  lensName: string
): FilterCopy {
  switch (constraintSlug) {
    case "time-scarcity":
      if (categoryLabel === "Task Managers") {
        return {
          intro: [
            "Use this filter when your task manager needs to stay quick under real daily pressure.",
            "It narrows the field to task managers that let you capture, review, and finish work without friction.",
          ],
          startHere: [
            "You manage tasks in short bursts and need to get in and out fast.",
            "Your current system takes too long to capture, review, or check off simple work.",
            "You want a tool that helps immediately without daily re-planning.",
          ],
          skipThis: [
            "You care more about advanced workflow depth than daily speed.",
            "You are willing to trade speed for more structure and control.",
          ],
          topFailureLine:
            "If the tool is slower than the task, it fails this filter.",
          failureExplanation: [
            "This filter removes task managers that slow down basic daily actions.",
            "They break when capture, planning, or checking off work takes more effort than the task itself.",
          ],
          failsHere:
            "More setup, more screens, more decisions before you can act.",
          survivesHere:
            "Quick capture, obvious next steps, and fast repeat use.",
        };
      }
      return {
        intro: [
          `Use this filter when daily speed matters and you want ${categoryLabel.toLowerCase()} that stay fast in regular use.`,
          "It narrows the field to tools that keep routine actions short and clear.",
        ],
        startHere: [
          "You use this tool often and want the routine workflow to stay short.",
          "You care more about speed in repeated use than extra flexibility.",
        ],
        skipThis: [
          "You are willing to accept slower daily use for other strengths.",
        ],
        topFailureLine:
          "If routine actions take too many steps, the tool fails this filter.",
        failureExplanation: [
          "This filter removes tools that slow down normal use.",
          "They break when routine actions require too many steps or too much attention.",
        ],
        failsHere:
          "More clicks, more steps, more attention for routine work.",
        survivesHere:
          "Short paths, fast repeat actions, and obvious next steps.",
      };
    case "setup-tolerance":
      return {
        intro: [
          `Use this filter when you want to get started with ${categoryLabel.toLowerCase()} quickly.`,
          "It narrows the field to tools that deliver value before heavy setup.",
        ],
        startHere: [
          "You want a working result quickly.",
          "You do not want to configure a system before it proves useful.",
        ],
        skipThis: ["You are comfortable with heavier setup if it pays off later."],
        topFailureLine:
          "If setup shows up before value, the tool fails this filter.",
        failureExplanation: [
          "This filter removes tools that make you build the system before you can use it.",
          "They break when configuration delays the first useful result.",
        ],
        failsHere:
          "More setup, more structure, more work before the first result.",
        survivesHere:
          "Quick starts and useful output before heavy setup.",
      };
    case "maintenance-load":
      return {
        intro: [
          `Use this filter when you want ${categoryLabel.toLowerCase()} that keep working without regular cleanup or admin work.`,
          "It narrows the field to tools that do the job without becoming upkeep.",
        ],
        startHere: [
          "You want the tool to stay usable without babysitting it.",
          "You do not want recurring cleanup just to keep things working.",
        ],
        skipThis: ["You are fine managing and tuning the tool regularly."],
        topFailureLine:
          "If the tool creates recurring upkeep, it fails this filter.",
        failureExplanation: [
          "This filter removes tools that keep asking for upkeep after the initial setup.",
          "They break when staying organized becomes a repeating chore.",
        ],
        failsHere:
          "Ongoing cleanup, adjustments, or maintenance as part of normal use.",
        survivesHere:
          "Stable day-to-day use with little ongoing attention.",
      };
    case "switching-cost":
      return {
        intro: [
          "Use this filter when your use is short-term or tentative and you do not want heavy setup.",
          "It narrows the field to tools that are useful quickly and easy to leave later.",
        ],
        startHere: [
          "You may switch tools later.",
          "You want value now without deep lock-in.",
        ],
        skipThis: ["You are happy to invest heavily in a long-term system."],
        topFailureLine:
          "If the tool demands commitment before it proves itself, it fails this filter.",
        failureExplanation: [
          "This filter removes tools that are expensive to unwind once you have configured them.",
          "They break when deep setup only makes sense if you plan to stay.",
        ],
        failsHere:
          "Too much setup, migration effort, or habit change for a tentative choice.",
        survivesHere:
          "Easy to start, easy to leave, and useful right away.",
      };
    case "ceiling-check":
      return {
        intro: [
          `Use this filter when you expect your needs to grow and want ${categoryLabel.toLowerCase()} with room to grow.`,
          "It narrows the field to tools that will not become the bottleneck too early.",
        ],
        startHere: [
          "You expect your workflow to get deeper or more demanding.",
          "You want to avoid outgrowing the tool too soon.",
        ],
        skipThis: ["You only need something small and lightweight for now."],
        topFailureLine:
          "If the limits arrive before your workflow is mature, the tool fails this filter.",
        failureExplanation: [
          "This filter removes tools whose limits arrive too early.",
          "They break when scale, depth, or control matters more than it did at the start.",
        ],
        failsHere:
          "An early ceiling on scale, depth, automation, or control.",
        survivesHere:
          "More room to grow before a migration becomes necessary.",
      };
    case "fear-of-breaking":
      return {
        intro: [
          `Use this filter when fragility is the real risk and you want ${categoryLabel.toLowerCase()} that do not feel easy to break.`,
          "It narrows the field to tools with safer defaults and less day-to-day fragility.",
        ],
        startHere: [
          "You care more about safe defaults than maximum control.",
          "You want a tool that feels forgiving in normal use.",
        ],
        skipThis: ["You are comfortable managing brittle setup or advanced configuration."],
        topFailureLine:
          "If one wrong setting can quietly break things, the tool fails this filter.",
        failureExplanation: [
          "This filter removes tools that punish small mistakes or feel easy to mis-set.",
          "They break when settings are brittle or a wrong choice quietly causes problems.",
        ],
        failsHere:
          "Brittle settings and an easy path to accidental breakage.",
        survivesHere:
          "Forgiving defaults and normal use that does not feel fragile.",
      };
    case "feature-aversion":
      return {
        intro: [
          `Use this filter when you want ${categoryLabel.toLowerCase()} to stay simple.`,
          "It narrows the field to tools that stay focused on the core job.",
        ],
        startHere: [
          "You want a smaller surface area.",
          "You care more about simplicity than extra capabilities.",
        ],
        skipThis: ["You want bundled features and do not mind extra layers."],
        topFailureLine:
          "If basic use feels more complicated than the job requires, the tool fails this filter.",
        failureExplanation: [
          "This filter removes tools that over-expand the workflow with features you did not ask for.",
          "They break when extra controls and layers get in the way of basic use.",
        ],
        failsHere:
          "Too many layers, controls, or bundled features for the basic job.",
        survivesHere:
          "A smaller surface area and a direct path to the core job.",
      };
    default:
      return {
        intro: [
          `Use this filter when ${lensName.toLowerCase()} is the main pressure point.`,
          `It keeps the page focused on that constraint instead of a generic feature comparison.`,
        ],
        startHere: ["You want to filter around this specific constraint first."],
        skipThis: ["Another filter is a better match for your main risk."],
        topFailureLine:
          "If the tool creates the friction this filter is meant to avoid, it fails here.",
        failureExplanation: [
          "This filter removes options that predictably break first under this constraint.",
        ],
        failsHere:
          "The failure pattern this filter is trying to avoid.",
        survivesHere:
          "A workable fit under this exact constraint.",
      };
  }
}

export default async function CategoryGatePage({
  params,
}: {
  params: Promise<{ category: string; constraint: string }>;
}) {
  const { category, constraint } = await params;
  const gate = getCategoryGate(category, constraint);
  if (!gate) return notFound();

  const lensName = gate.uiConstraintName ?? gate.constraintLabel;
  const filterCopy = getFilterCopy(gate.constraintSlug, gate.categoryLabel, lensName);
  const allParams = listCategoryGateParams();
  const otherGatesSameCategory = allParams
    .filter((value) => value.category === category && value.constraint !== constraint)
    .map((value) => {
      const otherGate = getCategoryGate(value.category, value.constraint);

      return {
        href: `/tools/${value.category}/${value.constraint}`,
        label:
          otherGate?.uiConstraintName ??
          otherGate?.constraintLabel ??
          prettyFromSlug(value.constraint),
      };
    });

  const failing = uniqueExampleToolNames(
    gate.tools.filter((tool) => tool.fails).map((tool) => tool.name)
  );
  const safe = uniqueExampleToolNames(
    gate.tools.filter((tool) => !tool.fails).map((tool) => tool.name)
  );
  const failingTop = failing.slice(0, 8);
  const safeTop = safe.slice(0, 8);

  const manualRelated = gate.relatedComparisons ?? [];
  const topComparisons = getTopComparisonsForSituation(
    gate.categorySlug,
    gate.constraintSlug,
    manualRelated
  );

  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ButtonLink href="/tools" variant="ghost" className="px-0 py-0">
            All filters
          </ButtonLink>
          <p className="text-xs text-black/60">
            Category:{" "}
            <span className="font-medium text-black/75">{gate.categoryLabel}</span>
          </p>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          {lensName} {"\u2014"} {gate.categoryLabel}
        </h1>

        <div className="space-y-2 text-sm leading-7 text-black/70">
          {filterCopy.intro.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <p className="text-sm text-black/60">
          Focus: <span className="font-medium text-black/75">{lensName}</span>
        </p>
      </header>

      <Card className="space-y-3">
        <SectionHeading title="Start here" />
        <p className="text-sm font-medium leading-6 text-black/80">
          {filterCopy.topFailureLine}
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
              Start here if
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/80">
              {filterCopy.startHere.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
              Skip this if
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/80">
              {filterCopy.skipThis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeading title="Tool checker" />
        <CategoryGateClient gate={gate} />
      </Card>

      <section className="content-stack gap-6">
        <Card className="space-y-4">
          <SectionHeading title="Failure explanation" />
          <div className="space-y-2 text-sm leading-6 text-black/75">
            {filterCopy.failureExplanation.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionHeading title="What survives vs fails" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Fails here
              </h3>
              <p className="text-sm leading-6 text-black/75">{filterCopy.failsHere}</p>
            </div>
            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Survives here
              </h3>
              <p className="text-sm leading-6 text-black/75">{filterCopy.survivesHere}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionHeading title="Examples" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Often fails
              </h3>
              {failingTop.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/80">
                  {failingTop.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-black/70">
                  Nothing is flagged yet. Add failure mappings as you publish more
                  comparisons.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Usually safe
              </h3>
              {safeTop.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/80">
                  {safeTop.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-black/70">Nothing is mapped yet.</p>
              )}
            </div>
          </div>
          {(failing.length > failingTop.length || safe.length > safeTop.length) && (
            <p className="text-xs text-black/55">
              This page shows a sample. The dropdown above includes the full mapped
              set.
            </p>
          )}
        </Card>

        {otherGatesSameCategory.length > 0 && (
          <Card className="space-y-4">
            <SectionHeading title="Other filters" />
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {otherGatesSameCategory.map((otherGate) => (
                <li key={otherGate.href}>
                  <Link
                    href={otherGate.href}
                    className="text-black/80 hover:text-black hover:underline"
                  >
                    {otherGate.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading title="Top comparisons for this situation" />
            <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
              View all comparisons
            </ButtonLink>
          </div>

          {topComparisons.length === 0 ? (
            <p className="text-sm text-black/60">No comparisons mapped yet.</p>
          ) : (
            <Card>
              <ul className="space-y-2 text-sm">
                {topComparisons.map((compare) => (
                  <li key={compare.slug}>
                    <Link
                      href={`/compare/${compare.slug}`}
                      className="text-black/80 hover:text-black hover:underline"
                    >
                      {compare.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </section>
    </main>
  );
}
