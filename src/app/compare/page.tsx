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

export default function CompareIndexPage() {
  const slugs = listPageSlugs();

  // FIX: properly filter out nulls and preserve typing
  const pages: PageDoc[] = slugs
    .map((slug) => loadPageBySlug(slug))
    .filter((p): p is PageDoc => p !== null)
    .sort((a, b) => a.title.localeCompare(b.title));

  // Group by category
  const groups = new Map<string, PageDoc[]>();

  for (const p of pages) {
    const cat = getCategory(p);
    const arr = groups.get(cat) || [];
    arr.push(p);
    groups.set(cat, arr);
  }

  const categories = Array.from(groups.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-5xl font-bold tracking-tight">
          Decision Clarities
        </h1>

        <p className="text-base text-black/75">
          Constraint-based tool comparisons that show which option fails first —
          for a specific persona.
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
        <div className="space-y-12">
          {categories.map((cat) => {
            const items = (groups.get(cat) || [])
              .slice()
              .sort((a, b) => a.title.localeCompare(b.title));

            return (
              <section key={cat} className="space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {cat}
                  </h2>
                  <div className="text-sm text-black/55">
                    {items.length}{" "}
                    {items.length === 1 ? "comparison" : "comparisons"}
                  </div>
                </div>

                <ul className="space-y-3">
                  {items.map((p) => {
                    const verdictPreview = firstSentence(
                      p.verdict.summary
                    );

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
                          <span className="font-medium text-black/75">
                            {p.persona}
                          </span>{" "}
                          · What you care about:{" "}
                          <span className="font-medium text-black/75">
                            {p.constraint_lens}
                          </span>
                        </div>

                        <div className="mt-3 text-sm leading-6">
                          <span className="font-medium">Verdict:</span>{" "}
                          <span className="text-black/75">
                            {verdictPreview}
                          </span>
                        </div>

                        <div className="mt-3">
                          <Link
                            href={`/compare/${p.slug}`}
                            className="text-sm text-black/70 hover:text-black underline underline-offset-4"
                          >
                            Read full comparison →
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
