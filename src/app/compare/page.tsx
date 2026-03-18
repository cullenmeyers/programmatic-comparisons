import type { Metadata } from "next";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import { absoluteUrl } from "@/lib/site";
import Link from "next/link";
import ComparePageBehavior from "./ComparePageBehavior";
import {
  getPageCategoryLabel,
  getPageCategorySlug,
  listPageDocs,
  type PageDoc,
} from "@/lib/pages";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Compare Tools",
  description:
    "Browse constraint-based tool comparisons by category and persona to find the option that fails last for your situation.",
  alternates: {
    canonical: absoluteUrl("/compare"),
  },
};

function firstSentence(text: string) {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : trimmed;
}

function categoryAnchorId(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CompareIndexPage() {
  const pages: PageDoc[] = listPageDocs().sort((a, b) => a.title.localeCompare(b.title));

  const groups = new Map<
    string,
    { label: string; slug: string | null; pages: PageDoc[] }
  >();

  for (const page of pages) {
    const label = getPageCategoryLabel(page);
    const existing = groups.get(label);

    if (existing) {
      existing.pages.push(page);
      if (!existing.slug) {
        existing.slug = getPageCategorySlug(page);
      }
      continue;
    }

    groups.set(label, {
      label,
      slug: getPageCategorySlug(page),
      pages: [page],
    });
  }

  const categories = Array.from(groups.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  return (
    <main className="site-container page-shell content-stack">
      <ComparePageBehavior />
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Compare tools
        </h1>
        <p className="max-w-2xl text-base leading-7 text-black/70">
          Constraint-based comparisons that show which option fails first for a
          specific persona.
        </p>
      </header>

      {pages.length === 0 ? (
        <Card>
          <p className="text-black/70">
            No pages yet. Add JSON files to <code>content/pages</code>.
          </p>
        </Card>
      ) : (
        <>
          <section id="categories" className="content-stack gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionHeading title="Browse by category" />
              <p className="text-sm text-black/55">
                {pages.length} total comparisons
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const href = category.slug
                  ? `/${category.slug}`
                  : `#${categoryAnchorId(category.label)}`;

                return (
                  <PillLink
                    key={category.label}
                    href={href}
                  >
                    {category.label}{" "}
                    <span className="text-black/50">({category.pages.length})</span>
                  </PillLink>
                );
              })}
            </div>
            <p className="text-xs text-black/55">
              Category links open the dedicated hub page. The full directory stays below.
            </p>
          </section>

          <div className="content-stack gap-5">
            {categories.map((category, index) => {
              const sectionId = categoryAnchorId(category.label);
              const categoryHref = category.slug ? `/${category.slug}` : null;
              const items = category.pages.slice().sort((a, b) => a.title.localeCompare(b.title));

              return (
                <section key={category.label} id={sectionId} className="scroll-mt-28">
                  <details
                    open={index < 2}
                    className="rounded-xl border border-black/10 bg-white"
                  >
                    <summary className="list-none cursor-pointer p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {categoryHref ? (
                          <Link
                            href={categoryHref}
                            className="text-2xl font-semibold tracking-tight text-black hover:underline"
                          >
                            {category.label}
                          </Link>
                        ) : (
                          <h2 className="text-2xl font-semibold tracking-tight text-black">
                            {category.label}
                          </h2>
                        )}
                        <p className="text-sm text-black/55">
                          {items.length}{" "}
                          {items.length === 1 ? "comparison" : "comparisons"}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-black/55">
                        {categoryHref
                          ? "Open the category page or expand this group."
                          : "Expand or collapse this group."}
                      </div>
                    </summary>

                    <div className="space-y-3 px-5 pb-5">
                      {categoryHref ? (
                        <div className="pb-1">
                          <ButtonLink href={categoryHref} variant="ghost" className="px-0 py-0 text-sm">
                            View category page
                          </ButtonLink>
                        </div>
                      ) : null}
                      {items.map((page) => {
                        const verdictPreview = firstSentence(page.verdict.summary);
                        return (
                          <Card key={page.slug} className="space-y-3 p-4">
                            <Link
                              href={`/compare/${page.slug}`}
                              className="text-base font-semibold text-black"
                            >
                              {page.title}
                            </Link>
                            <p className="text-sm text-black/65">
                              Persona:{" "}
                              <span className="font-medium text-black/75">
                                {page.persona}
                              </span>{" "}
                              | Focus:{" "}
                              <span className="font-medium text-black/75">
                                {page.constraint_lens}
                              </span>
                            </p>
                            <p className="text-sm leading-6 text-black/75">
                              <span className="font-medium text-black">Verdict:</span>{" "}
                              {verdictPreview}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <ButtonLink
                                href={`/compare/${page.slug}`}
                                variant="ghost"
                                className="px-0 py-0 text-sm"
                              >
                                Read full comparison
                              </ButtonLink>
                              <a href="#categories" className="text-sm text-black/60 hover:text-black">
                                Back to categories
                              </a>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </details>
                </section>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
