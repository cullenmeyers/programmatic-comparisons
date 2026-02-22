import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import PillLink from "@/components/ui/PillLink";
import SectionHeading from "@/components/ui/SectionHeading";
import Link from "next/link";
import { listPageSlugs, loadPageBySlug, type PageDoc } from "@/lib/pages";

export const dynamic = "force-static";

function firstSentence(text: string) {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : trimmed;
}

function getCategory(page: PageDoc) {
  const raw = (page.category ?? "").toString().trim();
  return raw || "Uncategorized";
}

function categoryAnchorId(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CompareIndexPage() {
  const slugs = listPageSlugs();

  const pages: PageDoc[] = slugs
    .map((slug) => loadPageBySlug(slug))
    .filter((page): page is PageDoc => page !== null)
    .sort((a, b) => a.title.localeCompare(b.title));

  const groups = new Map<string, PageDoc[]>();
  for (const page of pages) {
    const category = getCategory(page);
    const inCategory = groups.get(category) || [];
    inCategory.push(page);
    groups.set(category, inCategory);
  }

  const categories = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  const categoryMeta = categories.map((category) => {
    const items = groups.get(category) || [];
    return {
      category,
      id: categoryAnchorId(category),
      count: items.length,
    };
  });

  return (
    <main className="site-container page-shell content-stack">
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
              <SectionHeading title="Jump to a category" />
              <p className="text-sm text-black/55">
                {pages.length} total comparisons
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryMeta.map(({ category, id, count }) => (
                <PillLink key={id} href={`#${id}`}>
                  {category} <span className="text-black/50">({count})</span>
                </PillLink>
              ))}
            </div>
            <p className="text-xs text-black/55">
              Categories are collapsible. Expand only what you need.
            </p>
          </section>

          <div className="content-stack gap-5">
            {categories.map((category, index) => {
              const items = (groups.get(category) || [])
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title));
              const sectionId = categoryAnchorId(category);

              return (
                <section key={category} id={sectionId} className="scroll-mt-28">
                  <details
                    open={index < 2}
                    className="rounded-xl border border-black/10 bg-white"
                  >
                    <summary className="list-none cursor-pointer p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-2xl font-semibold tracking-tight text-black">
                          {category}
                        </h2>
                        <p className="text-sm text-black/55">
                          {items.length}{" "}
                          {items.length === 1 ? "comparison" : "comparisons"}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-black/55">
                        Expand or collapse this group.
                      </div>
                    </summary>

                    <div className="space-y-3 px-5 pb-5">
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
                              · Focus:{" "}
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
