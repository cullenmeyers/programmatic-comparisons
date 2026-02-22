import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { getCategoryGate, listCategoryGateParams } from "@/content/categoryGates";
import { listComparisonsForGate } from "@/lib/pages";
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
  };
}

function prettyFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function lensOneLiner(constraintSlug: string) {
  switch (constraintSlug) {
    case "setup-tolerance":
      return "Eliminate tools that require too much setup before you can do the basic job.";
    case "maintenance-load":
      return "Eliminate tools that require ongoing admin upkeep to keep working smoothly.";
    case "switching-cost":
      return "Eliminate tools that lock you in when your use is short-term or changing.";
    case "time-scarcity":
      return "Eliminate tools that add extra steps, layers, or decisions when time is tight.";
    case "ceiling-check":
      return "Eliminate tools that cap out once your workflows get advanced.";
    case "fear-of-breaking":
      return "Eliminate tools that feel risky to configure or easy to accidentally mis-set.";
    case "feature-aversion":
      return "Eliminate tools that add unnecessary features or automation beyond the basic job.";
    default:
      return "Eliminate tools that fail first under this constraint.";
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
  const allParams = listCategoryGateParams();
  const otherGatesSameCategory = allParams
    .filter((value) => value.category === category && value.constraint !== constraint)
    .map((value) => ({
      href: `/tools/${value.category}/${value.constraint}`,
      label: prettyFromSlug(value.constraint),
    }));

  const failing = gate.tools.filter((tool) => tool.fails).map((tool) => tool.name);
  const safe = gate.tools.filter((tool) => !tool.fails).map((tool) => tool.name);
  const failingTop = failing.slice(0, 8);
  const safeTop = safe.slice(0, 8);

  const computedRelated = listComparisonsForGate(gate.categorySlug, gate.constraintSlug);
  const manualRelated = gate.relatedComparisons ?? [];
  const related = Array.from(new Set([...computedRelated, ...manualRelated]));

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
            {lensOneLiner(gate.constraintSlug)}
          </p>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
              What &quot;fails&quot; means here
            </h3>
            <p className="mt-2 text-sm leading-6 text-black/75">
              A tool is flagged as &quot;fails&quot; if it predictably creates friction
              under this focus, meaning it tends to break first for people who care
              about{" "}
              <span className="font-medium">{lensName}</span>.
            </p>
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
                {related.map((compareSlug) => (
                  <li key={compareSlug}>
                    <Link
                      href={`/compare/${compareSlug}`}
                      className="text-black/80 hover:text-black hover:underline"
                    >
                      {compareSlug.replace(/-/g, " ")}
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
