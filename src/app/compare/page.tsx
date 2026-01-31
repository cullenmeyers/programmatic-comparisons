import Link from "next/link";
import { listPageSlugs, loadPageBySlug } from "@/lib/pages";

export const dynamic = "force-static";

function firstSentence(text: string) {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : trimmed;
}

export default function CompareIndexPage() {
  const slugs = listPageSlugs();

  const pages = slugs
    .map((slug) => loadPageBySlug(slug))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <header className="space-y-3">
        <h1 className="text-5xl font-bold tracking-tight">
          Decision Clarities
        </h1>

        <p className="text-base opacity-80">
          Constraint-based tool comparisons that show which option fails first —
          for a specific persona.
        </p>

        <p className="text-sm opacity-75">
          Pick a comparison below to see the verdict and the decision rule.
        </p>
      </header>

      {pages.length === 0 ? (
        <p className="opacity-80">
          No pages yet. Add JSON files to <code>content/pages</code>.
        </p>
      ) : (
        <ul className="space-y-3">
          {pages.map((p) => {
            const verdictPreview = firstSentence(p.verdict.summary);

            return (
              <li
                key={p.slug}
                className="rounded-lg border p-4 transition hover:bg-black/5"
              >
                <Link
                  href={`/compare/${p.slug}`}
                  className="text-lg font-semibold underline underline-offset-4"
                >
                  {p.title}
                </Link>

                <div className="mt-1 text-sm opacity-80">
                  Persona: <span className="font-medium">{p.persona}</span> ·
                  Lens:{" "}
                  <span className="font-medium">{p.constraint_lens}</span>
                </div>

                <div className="mt-3 text-sm leading-6">
                  <span className="font-medium">Verdict:</span>{" "}
                  <span className="opacity-90">{verdictPreview}</span>
                </div>

                <div className="mt-3">
                  <Link
                    href={`/compare/${p.slug}`}
                    className="text-sm underline underline-offset-4 opacity-80"
                  >
                    Read full comparison →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
