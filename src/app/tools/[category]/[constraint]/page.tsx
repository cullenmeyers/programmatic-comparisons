import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { getCategoryGate, listCategoryGateParams } from "@/content/categoryGates";
import { getComparisonTitleBySlug, listComparisonsForGate } from "@/lib/pages";
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

type FilterCopy = {
  intro: string[];
  startHere: string[];
  skipThis: string[];
  failureExplanation: string[];
  failsHere: string;
  survivesHere: string;
};

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
            "Use this filter when task management has to stay quick in the middle of a busy day.",
            "It narrows task managers that let you capture, review, and finish work without extra planning overhead.",
            "Tools fail here when routine actions turn into setup, sorting, or too many decisions.",
          ],
          startHere: [
            "You add and check tasks in short bursts between meetings or other work.",
            "You want a task manager you can trust without rebuilding your system every day.",
            "Your current app feels slower than the task itself.",
          ],
          skipThis: [
            "You are optimizing for complex workflows, team coordination, or deep project structure first.",
            "You are willing to accept more daily overhead in exchange for more control.",
          ],
          failureExplanation: [
            "This filter removes task managers that add friction to basic daily actions.",
            "They usually break when capture, planning, and checking off work takes too many steps.",
            "When that happens, the system starts competing with the work instead of supporting it.",
          ],
          failsHere:
            "These tools break when simple task management turns into extra clicks, extra screens, or extra planning before you can act.",
          survivesHere:
            "These tools stay safe when the next step is obvious, repeated actions are fast, and the app does not demand constant mental overhead.",
        };
      }
      return {
        intro: [
          `Use this filter when daily speed matters and you need ${categoryLabel.toLowerCase()} that works fast without adding workflow overhead.`,
          `It narrows options around ${lensName.toLowerCase()}: fast operation, fewer decisions, and less drag in repeated use.`,
          "Tools fail here when routine actions take too many steps or attention.",
        ],
        startHere: [
          "You use this category often and want shorter routine workflows.",
          "You care more about fast repeated use than extra flexibility.",
        ],
        skipThis: [
          "You are okay with slower daily use in exchange for other strengths.",
        ],
        failureExplanation: [
          "This filter removes tools that slow down normal use.",
          "They usually break when routine actions require too many steps or too much attention.",
        ],
        failsHere:
          "These tools break when repeated actions feel slower than the job itself.",
        survivesHere:
          "These tools stay safe when common actions are quick and the path stays obvious.",
      };
    case "setup-tolerance":
      return {
        intro: [
          `Use this filter when you want to get started with ${categoryLabel.toLowerCase()} quickly and avoid front-loaded setup before the basic job is even live.`,
          `It narrows options around ${lensName.toLowerCase()}: fast starts, low setup drag, and a shorter path from signup to useful output.`,
          "Tools fail here when setup shows up before value does.",
        ],
        startHere: [
          "You want to get to a working result quickly.",
          "You do not want to configure a system before using it.",
        ],
        skipThis: ["You are comfortable with heavier setup if it pays off later."],
        failureExplanation: [
          "This filter removes tools that make you build the system before you can use it.",
          "They usually break when configuration delays the first useful result.",
        ],
        failsHere:
          "These tools break when setup, structure, or account work blocks the first real result.",
        survivesHere:
          "These tools stay safe when you can start quickly and postpone heavier setup until later.",
      };
    case "maintenance-load":
      return {
        intro: [
          `Use this filter when you want ${categoryLabel.toLowerCase()} that stays useful without regular tending, cleanup, or admin upkeep.`,
          `It narrows options around ${lensName.toLowerCase()}: tools that do the job without turning into something you have to babysit.`,
          "Tools fail here when they keep asking for ongoing cleanup or adjustment.",
        ],
        startHere: [
          "You want a tool that stays usable with light-touch ownership.",
          "You do not want recurring cleanup to keep things working.",
        ],
        skipThis: ["You are fine managing and tuning the tool regularly."],
        failureExplanation: [
          "This filter removes tools that keep asking for upkeep after the initial setup.",
          "They usually break when staying organized becomes a repeating chore.",
        ],
        failsHere:
          "These tools break when cleanup, monitoring, or workflow maintenance becomes part of normal use.",
        survivesHere:
          "These tools stay safe when they remain stable without constant attention.",
      };
    case "switching-cost":
      return {
        intro: [
          `Use this filter when your use is short-term, tentative, or likely to change and you do not want heavy setup that only pays back after a long commitment.`,
          `It narrows options around ${lensName.toLowerCase()}: low commitment, easy exits, and getting value now without building around a tool you may not keep.`,
          "Tools fail here when they ask for too much commitment up front.",
        ],
        startHere: [
          "You may switch tools later.",
          "You want value now without deep lock-in.",
        ],
        skipThis: ["You are happy to invest heavily in a long-term system."],
        failureExplanation: [
          "This filter removes tools that are expensive to unwind once you have configured them.",
          "They usually break when deep setup only makes sense if you plan to stay.",
        ],
        failsHere:
          "These tools break when setup, migration, or habit changes create too much commitment.",
        survivesHere:
          "These tools stay safe when they are easy to start, easy to leave, and still useful right away.",
      };
    case "ceiling-check":
      return {
        intro: [
          `Use this filter when you expect your needs to grow and want ${categoryLabel.toLowerCase()} that will not cap out too early.`,
          `It narrows options around ${lensName.toLowerCase()}: headroom, flexibility, and avoiding tools that become the bottleneck later.`,
          "Tools fail here when limits arrive before your workflow is done growing.",
        ],
        startHere: [
          "You expect your workflow to get deeper or more demanding.",
          "You want to avoid outgrowing the tool too soon.",
        ],
        skipThis: ["You only need something small and lightweight for now."],
        failureExplanation: [
          "This filter removes tools whose limits arrive too early.",
          "They usually break when scale, depth, or control matters more than it did at the start.",
        ],
        failsHere:
          "These tools break when automation, scale, or control tops out too soon.",
        survivesHere:
          "These tools stay safe when they leave room to grow without forcing an early migration.",
      };
    case "fear-of-breaking":
      return {
        intro: [
          `Use this filter when fragility is the real risk and you want ${categoryLabel.toLowerCase()} that does not feel easy to misconfigure or accidentally break.`,
          `It narrows options around ${lensName.toLowerCase()}: safer defaults, lower misconfiguration risk, and less fragility in normal use.`,
          "Tools fail here when small mistakes quietly break the result.",
        ],
        startHere: [
          "You care more about safe defaults than maximum control.",
          "You want a tool that feels forgiving in normal use.",
        ],
        skipThis: ["You are comfortable managing brittle setup or advanced configuration."],
        failureExplanation: [
          "This filter removes tools that punish small mistakes or feel easy to mis-set.",
          "They usually break when settings are brittle or a wrong choice quietly causes problems.",
        ],
        failsHere:
          "These tools break when the workflow is easy to misconfigure or accidentally break.",
        survivesHere:
          "These tools stay safe when defaults are forgiving and normal use does not feel fragile.",
      };
    case "feature-aversion":
      return {
        intro: [
          `Use this filter when you want ${categoryLabel.toLowerCase()} to stay simple and do not want extra layers, extra automation, or unnecessary complexity.`,
          `It narrows options around ${lensName.toLowerCase()}: fewer moving parts and less feature weight between you and the core job.`,
          "Tools fail here when basic use feels more complicated than it should.",
        ],
        startHere: [
          "You want a smaller surface area and less feature weight.",
          "You care more about simplicity than extra capabilities.",
        ],
        skipThis: ["You want bundled features and do not mind extra layers."],
        failureExplanation: [
          "This filter removes tools that over-expand the workflow with features you did not ask for.",
          "They usually break when extra controls and layers get in the way of basic use.",
        ],
        failsHere:
          "These tools break when the surface area becomes larger than the job requires.",
        survivesHere:
          "These tools stay safe when you can do the core job without navigating a larger system.",
      };
    default:
      return {
        intro: [
          `Use this filter to narrow ${categoryLabel.toLowerCase()} around the specific pressure represented by ${lensName.toLowerCase()}.`,
          `It keeps the page focused on ${lensName.toLowerCase()} rather than generic feature comparison.`,
          "Tools fail here when they create the kind of friction this filter is meant to avoid.",
        ],
        startHere: ["You want to filter around this specific constraint first."],
        skipThis: ["Another filter is a better match for your main risk."],
        failureExplanation: [
          "This filter removes options that predictably break first under this constraint.",
        ],
        failsHere:
          "These tools break when they create the friction this filter is trying to avoid.",
        survivesHere:
          "These tools stay safe when they remain workable under this exact constraint.",
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

  const failing = gate.tools.filter((tool) => tool.fails).map((tool) => tool.name);
  const safe = gate.tools.filter((tool) => !tool.fails).map((tool) => tool.name);
  const failingTop = failing.slice(0, 8);
  const safeTop = safe.slice(0, 8);

  const computedRelated = listComparisonsForGate(gate.categorySlug, gate.constraintSlug);
  const manualRelated = gate.relatedComparisons ?? [];
  const related = Array.from(new Set([...computedRelated, ...manualRelated])).map(
    (compareSlug) => ({
      slug: compareSlug,
      title: getComparisonTitleBySlug(compareSlug),
    })
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

      <Card className="space-y-4">
        <SectionHeading title="Start here" />
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
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Fails here
              </h3>
              <p className="text-sm leading-6 text-black/75">{filterCopy.failsHere}</p>
            </div>
            <div className="space-y-2">
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
            <SectionHeading title="Related comparisons" />
            <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
              View all comparisons
            </ButtonLink>
          </div>

          {related.length === 0 ? (
            <p className="text-sm text-black/60">No comparisons mapped yet.</p>
          ) : (
            <Card>
              <ul className="space-y-2 text-sm">
                {related.map((compare) => (
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
