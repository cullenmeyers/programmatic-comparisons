import GatesPanel from "@/components/gates/GatesPanel";
import GatesEngine from "@/components/gates/GatesEngine";
import { getGatesForDoc } from "@/lib/gates/selector";
import Link from "next/link";
import type { Metadata } from "next";
import {
  loadPageBySlug,
  listPageSlugs,
  slugifyCompare,
  type PageDoc,
} from "@/lib/pages";

type Params = { slug: string };

export async function generateStaticParams() {
  return listPageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = loadPageBySlug(slug);

  if (!doc) {
    return {
      title: "Comparison | Decision Clarities",
      description:
        "Constraint-based tool comparisons: X vs Y for a specific persona. Clear decision rules, not feature lists.",
    };
  }

  const description =
    doc.meta_description?.trim() ||
    `A constraint-based comparison of ${doc.title}. See which option fails first for the ${doc.persona.toLowerCase()} and why.`;

  return {
    title: `${doc.title} | Decision Clarities`,
    description,
  };
}

function FAQJsonLd({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  if (!faqs || faqs.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Tool name extraction:
 * - If your JSON later includes x_name/y_name, we’ll use them (without TS errors).
 * - Otherwise we derive from doc.title like "Evernote vs Apple Notes for Solo Users".
 */
function getToolNames(doc: PageDoc): { xName: string; yName: string } {
  const maybe = doc as unknown as {
    x_name?: string;
    y_name?: string;
    title: string;
  };

  if (maybe.x_name?.trim() && maybe.y_name?.trim()) {
    return { xName: maybe.x_name.trim(), yName: maybe.y_name.trim() };
  }

  // Fallback: parse from title: "X vs Y for Persona"
  const title = doc.title || "";
  const beforeFor = title.split(" for ")[0] ?? title;
  const parts = beforeFor.split(" vs ");

  const xName = (parts[0] ?? "Option X").trim() || "Option X";
  const yName = (parts[1] ?? "Option Y").trim() || "Option Y";

  return { xName, yName };
}

// Backwards-compatible category getter (so old JSON pages don't break)
function getCategory(doc: PageDoc): string {
  const maybe = doc as unknown as { category?: string };
  const raw = (maybe.category ?? "").toString().trim();
  return raw || "Uncategorized";
}

function Section({
  section,
  xName,
  yName,
}: {
  section: PageDoc["sections"][number];
  xName: string;
  yName: string;
}) {
  switch (section.type) {
    case "persona_fit":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {section.heading}
          </h2>
          <p className="text-base leading-7 text-black/80">{section.content}</p>
        </section>
      );

    case "x_wins":
    case "y_wins":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {section.heading}
          </h2>
          <ul className="space-y-4 list-disc pl-5">
            {section.bullets.map((b, i) => (
              <li key={i}>
                <div className="font-medium">{b.point}</div>
                <div className="text-sm leading-6 text-black/70">
                  {b.why_it_matters}
                </div>
              </li>
            ))}
          </ul>
        </section>
      );

    case "failure_modes":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {section.heading}
          </h2>
          <div className="space-y-5">
            {section.items.map((it, i) => {
              const toolLabel = it.tool === "x" ? xName : yName;
              const optionLabel = it.tool === "x" ? "Option X" : "Option Y";

              return (
                <div
                  key={i}
                  className="rounded-xl border border-black/10 bg-white p-5"
                >
                  <div className="text-sm uppercase tracking-wide text-black/55">
                    {toolLabel}{" "}
                    <span className="normal-case text-black/60">
                      ({optionLabel})
                    </span>
                  </div>

                  <div className="mt-3 font-medium">Fails when</div>
                  <div className="text-sm leading-6 text-black/75">
                    {it.fails_when}
                  </div>

                  <div className="mt-4 font-medium">What to do instead</div>
                  <div className="text-sm leading-6 text-black/75">
                    {it.what_to_do_instead}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );

    case "quick_rules":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {section.heading}
          </h2>
          <ul className="space-y-2.5 list-disc pl-5">
            {section.rules.map((r, i) => (
              <li key={i} className="leading-7 text-black/85">
                {r}
              </li>
            ))}
          </ul>
        </section>
      );
  }
}

export default async function ComparePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const doc = loadPageBySlug(slug);

  if (!doc) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold">Comparison not found</h1>
        <p className="text-black/70">
          That page doesn’t exist yet. Go back to the comparisons list.
        </p>
        <Link className="underline underline-offset-4" href="/compare">
          ← All comparisons
        </Link>
      </main>
    );
  }

  const { xName, yName } = getToolNames(doc);
  const category = getCategory(doc);
 const gateIds = getGatesForDoc(doc);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-12">
      <FAQJsonLd faqs={doc.faqs} />

      {/* Minimal nav back to index */}
      <div className="text-sm">
        <Link
          className="text-black/65 hover:text-black underline-offset-4 hover:underline"
          href="/compare"
        >
          ← All comparisons
        </Link>
      </div>

      <header className="space-y-4">
        {/* Category line (quiet, helpful, non-template-y) */}
        <div className="text-xs uppercase tracking-wide text-black/55">
          Category:{" "}
          <span className="normal-case font-medium text-black/70">
            {category}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>

        <div className="text-sm text-black/60">
  Persona: <span className="font-medium text-black/75">{doc.persona}</span>{" "}
  · Lens:{" "}
  <span className="font-medium text-black/75">{doc.constraint_lens}</span>
</div>

{/* Verdict anchor */}
<div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6 space-y-3">
  <div className="text-sm uppercase tracking-wide text-black/55">Verdict</div>
  <p className="leading-7 text-black/85">{doc.verdict.summary}</p>
  <p className="text-sm leading-6 text-black/65">
    <span className="font-medium text-black/75">Rule:</span>{" "}
    {doc.verdict.decision_rule}
  </p>
</div>

{/* Gate 1: always show */}
<GatesPanel
  gateIds={gateIds}
  xName={xName}
  yName={yName}
  winner={doc.verdict.winner}
  decisionRule={doc.verdict.decision_rule}
  persona={doc.persona as any}
  defaultOpen={false}
/>



</header>

<div className="space-y-12">
  {doc.sections.map((section, idx) => (
    <Section key={idx} section={section} xName={xName} yName={yName} />
  ))}
</div>

<section className="space-y-4 pt-2">
  <h2 className="text-xl font-semibold tracking-tight">FAQs</h2>
  <div className="space-y-5">
    {doc.faqs.map((f, i) => (
      <div key={i} className="rounded-xl border border-black/10 bg-white p-5">
        <div className="font-medium">{f.q}</div>
        <div className="mt-2 text-sm leading-6 text-black/75">{f.a}</div>
      </div>
    ))}
  </div>
</section>


      <section className="space-y-4 pt-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Related comparisons
        </h2>

        {(() => {
          const existing = new Set(listPageSlugs());

          const items = (doc.related_pages || []).map((rp) => {
            const relatedSlug = slugifyCompare(rp.x_name, rp.y_name, rp.persona);
            const exists = existing.has(relatedSlug);
            return { rp, relatedSlug, exists };
          });

          const anyLinks = items.some((x) => x.exists);

          if (items.length === 0) {
            return (
              <p className="text-sm text-black/60">No related comparisons yet.</p>
            );
          }

          return (
            <>
              <ul className="list-disc pl-5 space-y-2">
                {items.map(({ rp, relatedSlug, exists }, i) => (
                  <li key={i} className="text-sm leading-6">
                    {exists ? (
                      <Link
                        className="text-black/80 hover:text-black underline-offset-4 hover:underline"
                        href={`/compare/${relatedSlug}`}
                      >
                        {rp.x_name} vs {rp.y_name} for {rp.persona}
                      </Link>
                    ) : (
                      <span className="text-black/60">
                        {rp.x_name} vs {rp.y_name} for {rp.persona}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {!anyLinks && (
                <p className="text-xs text-black/55">
                  Related pages will become clickable as you publish more
                  comparisons.
                </p>
              )}
            </>
          );
        })()}
      </section>
    </main>
  );
}

