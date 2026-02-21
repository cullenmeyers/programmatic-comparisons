// src/app/tools/[category]/[constraint]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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

  const desc =
    gate.description?.slice(0, 2).join(" ") ||
    `A deterministic decision gate for ${gate.categoryLabel} under ${gate.constraintLabel}.`;

  return {
    title: gate.title,
    description: desc,
  };
}

function prettyFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function lensOneLiner(constraintSlug: string) {
  // Keep these short and “definition-like” for SEO.
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
    .filter((p) => p.category === category && p.constraint !== constraint)
    .map((p) => ({
      href: `/tools/${p.category}/${p.constraint}`,
      label: prettyFromSlug(p.constraint),
    }));

  // Useful SEO/UI lists
  const failing = gate.tools.filter((t) => t.fails).map((t) => t.name);
  const safe = gate.tools.filter((t) => !t.fails).map((t) => t.name);

  // Keep these small; don’t dump huge lists.
  const failingTop = failing.slice(0, 8);
  const safeTop = safe.slice(0, 8);
  const computedRelated = listComparisonsForGate(
    gate.categorySlug,
    gate.constraintSlug
  );
  const manualRelated = gate.relatedComparisons ?? [];
  const related = Array.from(new Set([...computedRelated, ...manualRelated]));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <Link
            href="/tools"
            className="text-xs text-gray-700 underline underline-offset-4"
          >
            ← All gates
          </Link>

          <div className="text-[11px] text-gray-500">
            Category:{" "}
            <span className="font-medium text-gray-700">{gate.categoryLabel}</span>
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">{gate.title}</h1>

        <div className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
          {gate.description.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Filter: <span className="font-medium">{lensName}</span>
        </div>
      </header>

      {/* The actual interactive gate UI */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <CategoryGateClient gate={gate} />
      </section>

      {/* SEO support block (short, structured, useful) */}
      <section className="mt-10 space-y-8">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            What this gate does
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            This is a deterministic filter for{" "}
            <span className="font-medium">{gate.categoryLabel}</span> under the
            constraint{" "}
            <span className="font-medium">{lensName}</span>.{" "}
            {lensOneLiner(gate.constraintSlug)}
          </p>

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
            What “fails” means here
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            A tool is flagged as “fails” if it predictably creates friction under
            this constraint — meaning it’s the option that tends to break first
            for people who care about{" "}
            <span className="font-medium">{lensName}</span>.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            Examples in this category
          </h2>

          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Often fails under this constraint
              </h3>
              {failingTop.length ? (
                <ul className="mt-2 space-y-1 text-sm text-gray-800">
                  {failingTop.map((name) => (
                    <li key={name}>• {name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-700">
                  Nothing is flagged yet. Add failure mappings as you publish more
                  comparisons.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Usually safe under this constraint
              </h3>
              {safeTop.length ? (
                <ul className="mt-2 space-y-1 text-sm text-gray-800">
                  {safeTop.map((name) => (
                    <li key={name}>• {name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-700">
                  Nothing is mapped yet.
                </p>
              )}
            </div>
          </div>

          {(failing.length > failingTop.length || safe.length > safeTop.length) && (
            <p className="mt-4 text-xs text-gray-500">
              This page shows a small sample. The interactive gate dropdown shows the
              full mapped set.
            </p>
          )}
        </section>

        {/* “Other gates in this category” = internal linking + UX */}
        {otherGatesSameCategory.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Other gates for {gate.categoryLabel}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              {otherGatesSameCategory.map((g) => (
                <li key={g.href}>
                  <Link
                    href={g.href}
                    className="text-gray-900 underline underline-offset-4"
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related comparisons (already good — keep it, but add a “view all comparisons” link) */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Related comparisons
            </h2>
            <Link
              href="/compare"
              className="text-xs text-gray-700 underline underline-offset-4"
            >
              View all comparisons
            </Link>
          </div>

          {related.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No comparisons mapped yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {related.map((compareSlug) => (
                <li key={compareSlug}>
                  <Link
                    href={`/compare/${compareSlug}`}
                    className="text-gray-900 underline underline-offset-4"
                  >
                    {compareSlug.replace(/-/g, " ")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
