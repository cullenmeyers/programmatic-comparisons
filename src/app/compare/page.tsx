import Link from "next/link";
import { listPageSlugs, loadPageBySlug } from "@/lib/pages";

export const dynamic = "force-static";

export default function CompareIndexPage() {
  const slugs = listPageSlugs();

  const pages = slugs
    .map((slug) => loadPageBySlug(slug))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tool comparisons</h1>
        <p className="opacity-80">
          Constraint-based comparisons: X vs Y for a specific persona.
        </p>
      </header>

      {pages.length === 0 ? (
        <p className="opacity-80">No pages yet. Add JSON files to <code>content/pages</code>.</p>
      ) : (
        <ul className="space-y-3">
          {pages.map((p) => (
            <li key={p.slug} className="rounded-lg border p-4">
              <Link className="text-lg font-semibold underline underline-offset-4" href={`/compare/${p.slug}`}>
                {p.title}
              </Link>
              <div className="mt-1 text-sm opacity-80">
                Persona: <span className="font-medium">{p.persona}</span> · Lens:{" "}
                <span className="font-medium">{p.constraint_lens}</span>
              </div>
              <div className="mt-2 text-sm opacity-90">{p.verdict.summary}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
