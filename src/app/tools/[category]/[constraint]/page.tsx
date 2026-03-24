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

  const description =
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
  intro: string;
  whatItDoes: string;
  eliminates: string;
  failingTools: string;
  survivingTools: string;
  failureMeaning: string;
};

function getFilterCopy(
  constraintSlug: string,
  categoryLabel: string,
  lensName: string
): FilterCopy {
  switch (constraintSlug) {
    case "setup-tolerance":
      return {
        intro: `Use this filter when you want to get started with ${categoryLabel.toLowerCase()} quickly and avoid front-loaded setup before the basic job is even live.`,
        whatItDoes: `This filter keeps the page grounded in ${lensName.toLowerCase()}: fast starts, low setup drag, and a shorter path from signup to useful output.`,
        eliminates:
          "It is trying to eliminate tools that make you build the system before you can use the tool.",
        failingTools:
          "Tools usually fail here when they demand configuration, structure, or account setup that delays the first real result.",
        survivingTools:
          "Tools usually survive when they let you start quickly, prove value early, and postpone heavier setup until later.",
        failureMeaning:
          "A tool is flagged as fails here when the setup burden shows up before the payoff does.",
      };
    case "maintenance-load":
      return {
        intro: `Use this filter when you want ${categoryLabel.toLowerCase()} that stays useful without regular tending, cleanup, or admin upkeep.`,
        whatItDoes: `This filter focuses on ${lensName.toLowerCase()}: choosing options that do the job without turning into something you have to babysit.`,
        eliminates:
          "It is trying to eliminate tools that keep asking for ongoing upkeep after the initial setup is done.",
        failingTools:
          "Tools usually fail here when they create recurring cleanup, adjustment, monitoring, or workflow maintenance just to stay usable.",
        survivingTools:
          "Tools usually survive when they stay stable with light touch ownership and do not depend on constant attention.",
        failureMeaning:
          "A fails label here means the tool is more likely to become regular maintenance work than a set-and-forget option.",
      };
    case "switching-cost":
      return {
        intro: `Use this filter when your use is short-term, tentative, or likely to change and you do not want heavy setup that only pays back after a long commitment.`,
        whatItDoes: `This filter focuses on ${lensName.toLowerCase()}: low commitment, easy exits, and getting value now without building around a tool you may not keep.`,
        eliminates:
          "It is trying to eliminate tools that are expensive to unwind once you have configured them or moved your workflow into them.",
        failingTools:
          "Tools usually fail here when they ask for deep setup, migration effort, or habit changes that only make sense if you plan to stay.",
        survivingTools:
          "Tools usually survive when they are easy to start, easy to leave, and still useful without a long ramp or lock-in.",
        failureMeaning:
          "A fails label here means the tool creates more commitment than this short-term or low-commitment situation can justify.",
      };
    case "time-scarcity":
      return {
        intro: `Use this filter when daily speed matters and you need ${categoryLabel.toLowerCase()} that works fast without adding workflow overhead.`,
        whatItDoes: `This filter is about ${lensName.toLowerCase()}: fast operation, fewer decisions, and less drag in repeated day-to-day use.`,
        eliminates:
          "It is trying to eliminate tools that slow you down with extra steps, extra clicks, or too much workflow ceremony.",
        failingTools:
          "Tools usually fail here when the interface is slower than the job, when routine actions take too many steps, or when cognitive overhead piles up.",
        survivingTools:
          "Tools usually survive when common actions are quick, the path is obvious, and the tool does not make simple work feel long.",
        failureMeaning:
          "A fails label here means the tool predictably costs too much time or attention in normal use.",
      };
    case "ceiling-check":
      return {
        intro: `Use this filter when you expect your needs to grow and want ${categoryLabel.toLowerCase()} that will not cap out too early.`,
        whatItDoes: `This filter centers ${lensName.toLowerCase()}: headroom, flexibility, and avoiding tools that feel fine now but become the bottleneck later.`,
        eliminates:
          "It is trying to eliminate tools whose limits arrive before your workflow is done growing.",
        failingTools:
          "Tools usually fail here when they top out on automation, depth, scale, or control once your usage becomes more demanding.",
        survivingTools:
          "Tools usually survive when they leave room to expand without forcing an early migration to something stronger.",
        failureMeaning:
          "A fails label here means the tool is more likely to become the limiting factor as your use matures.",
      };
    case "fear-of-breaking":
      return {
        intro: `Use this filter when fragility is the real risk and you want ${categoryLabel.toLowerCase()} that does not feel easy to misconfigure or accidentally break.`,
        whatItDoes: `This filter focuses on ${lensName.toLowerCase()}: reducing fragility, lowering misconfiguration risk, and making the tool feel harder to mess up.`,
        eliminates:
          "It is trying to eliminate tools that punish small mistakes or make the correct setup feel easy to mis-set.",
        failingTools:
          "Tools usually fail here when settings are brittle, the workflow is easy to misconfigure, or a wrong choice can quietly break the result.",
        survivingTools:
          "Tools usually survive when defaults are safe, the setup is forgiving, and normal use does not feel like one wrong click away from problems.",
        failureMeaning:
          "A fails label here means the tool is more likely to create avoidable breakage, misconfiguration, or configuration anxiety.",
      };
    case "feature-aversion":
      return {
        intro: `Use this filter when you want ${categoryLabel.toLowerCase()} to stay simple and do not want extra layers, extra automation, or unnecessary complexity.`,
        whatItDoes: `This filter emphasizes ${lensName.toLowerCase()}: simpler tools, fewer moving parts, and less feature weight between you and the basic job.`,
        eliminates:
          "It is trying to eliminate tools that over-expand the workflow with features you did not ask for.",
        failingTools:
          "Tools usually fail here when they add extra layers, too many controls, or bundled capabilities that make basic use feel more complicated than it needs to be.",
        survivingTools:
          "Tools usually survive when they keep the surface area small and let you do the core job without navigating a larger system.",
        failureMeaning:
          "A fails label here means the tool adds more complexity than this simplicity-first situation wants.",
      };
    default:
      return {
        intro: `Use this filter to narrow ${categoryLabel.toLowerCase()} around the specific pressure represented by ${lensName.toLowerCase()}.`,
        whatItDoes: `This filter keeps the page focused on ${lensName.toLowerCase()} rather than generic feature comparison.`,
        eliminates: "It is trying to eliminate options that predictably break first under this constraint.",
        failingTools:
          "Tools usually fail here when they create the kind of friction this filter is meant to avoid.",
        survivingTools:
          "Tools usually survive when they stay workable under this exact constraint.",
        failureMeaning:
          "A fails label here means the tool is more likely to create friction under this focus than the alternatives that pass.",
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
          {gate.title}
        </h1>

        <div className="space-y-2 text-sm leading-7 text-black/70">
          <p>{filterCopy.intro}</p>
          {gate.description.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <p className="text-sm text-black/60">
          Focus: <span className="font-medium text-black/75">{lensName}</span>
        </p>
      </header>

      <Card>
        <CategoryGateClient gate={gate} />
      </Card>

      <section className="content-stack gap-6">
        <Card className="space-y-4">
          <SectionHeading title="What this filter does" />
          <p className="text-sm leading-6 text-black/75">
            This is a deterministic filter for{" "}
            <span className="font-medium">{gate.categoryLabel}</span> under the
            focus <span className="font-medium">{lensName}</span>.{" "}
            {filterCopy.whatItDoes}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Trying to eliminate
              </h3>
              <p className="text-sm leading-6 text-black/75">{filterCopy.eliminates}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Usually fails here
              </h3>
              <p className="text-sm leading-6 text-black/75">
                {filterCopy.failingTools}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Usually survives here
              </h3>
              <p className="text-sm leading-6 text-black/75">
                {filterCopy.survivingTools}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
              What &quot;fails&quot; means here
            </h3>
            <p className="mt-2 text-sm leading-6 text-black/75">{filterCopy.failureMeaning}</p>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionHeading title="Examples in this category" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Often fails under this focus
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
                Usually safe under this focus
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
            <SectionHeading title={`Other filters for ${gate.categoryLabel}`} />
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
