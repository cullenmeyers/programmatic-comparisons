import Link from "next/link";
import { listPageSlugs, loadPageBySlug, type PageDoc } from "@/lib/pages";

export const dynamic = "force-static";

function firstSentence(text: string) {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : trimmed;
}

function getCategory(p: PageDoc) {
  const raw = (p.category ?? "").toString().trim();
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
    .filter((p): p is PageDoc => p !== null)
    .sort((a, b) => a.title.localeCompare(b.title));

  const groups = new Map<string, PageDoc[]>();
  for (const p of pages) {
    const cat = getCategory(p);
    const arr = groups.get(cat) || [];
    arr.push(p);
    groups.set(cat, arr);
  }

  const categories = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  const categoryMeta = categories.map((cat) => {
    const items = groups.get(cat) || [];
    return { cat, id: categoryAnchorId(cat), count: items.length };
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-5xl font-bold tracking-tight">Decision Clarities</h1>

        <p className="text-base text-black/75">
          Constraint-based tool comparisons that show which option fails first — for a specific persona.
        </p>

        <p className="text-sm text-black/60">
          Browse by category. Each page is written for a persona + constraint lens.
        </p>
      </header>

      {pages.length === 0 ? (
        <p className="text-black/70">
          No pages yet. Add JSON files to <code>content/pages</code>.
        </p>
      ) : (
        <>
          {/* Category jump menu */}
          <section id="categories" className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-sm font-semibold tracking-tight">Jump to a category</h2>
              <div className="text-sm text-black/55">{pages.length} total comparisons</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryMeta.map(({ cat, id, count }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-sm hover:bg-black/[0.02]"
                >
                  <span className="underline underline-offset-4">{cat}</span>
                  <span className="text-black/55">({count})</span>
                </a>
              ))}
            </div>

            <p className="text-xs text-black/50">
              Tip: categories are collapsible. Expand only what you want.
            </p>
          </section>

          {/* Collapsible categories */}
          <div className="space-y-6">
            {categories.map((cat, idx) => {
              const items = (groups.get(cat) || [])
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title));

              const defaultOpen = idx < 2;
              const sectionId = categoryAnchorId(cat);

              return (
                <section key={cat} id={sectionId} className="scroll-mt-24">
                  <details open={defaultOpen} className="rounded-xl border border-black/10 bg-white">
                    <summary className="cursor-pointer list-none p-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h2 className="text-2xl font-semibold tracking-tight">{cat}</h2>
                        <div className="text-sm text-black/55">
                          {items.length} {items.length === 1 ? "comparison" : "comparisons"}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-4 text-sm text-black/55">
                        <span>Click to expand / collapse</span>
                        <a
                          href="#categories"
                          className="underline underline-offset-4 hover:text-black"
                        >
                          Back to categories ↑
                        </a>
                      </div>
                    </summary>

                    <div className="px-5 pb-5">
                      <ul className="space-y-3">
                        {items.map((p) => {
                          const verdictPreview = firstSentence(p.verdict.summary);

                          return (
                            <li
                              key={p.slug}
                              className="rounded-xl border border-black/10 bg-white p-5 transition hover:bg-black/[0.02]"
                            >
                              <Link
                                href={`/compare/${p.slug}`}
                                className="text-lg font-semibold underline underline-offset-4"
                              >
                                {p.title}
                              </Link>

                              <div className="mt-1 text-sm text-black/60">
                                Persona:{" "}
                                <span className="font-medium text-black/75">{p.persona}</span>{" "}
                                · What you care about:{" "}
                                <span className="font-medium text-black/75">{p.constraint_lens}</span>
                              </div>

                              <div className="mt-3 text-sm leading-6">
                                <span className="font-medium">Verdict:</span>{" "}
                                <span className="text-black/75">{verdictPreview}</span>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-4">
                                <Link
                                  href={`/compare/${p.slug}`}
                                  className="text-sm text-black/70 hover:text-black underline underline-offset-4"
                                >
                                  Read full comparison →
                                </Link>

                                <a
                                  href="#categories"
                                  className="text-sm text-black/55 hover:text-black underline underline-offset-4"
                                >
                                  Back to categories ↑
                                </a>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
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
