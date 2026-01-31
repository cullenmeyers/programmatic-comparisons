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

  // If something goes wrong, don't crash metadata generation
  if (!doc) {
    return {
      title: "Comparison | Decision Clarities",
      description:
        "Constraint-based tool comparisons: X vs Y for a specific persona. Clear decision rules, not feature lists.",
    };
  }

  // Prefer doc.meta_description if present, otherwise generate a good default
  const description =
    doc.meta_description?.trim() ||
    `A constraint-based comparison of ${doc.title}. See which option fails first for the ${doc.persona.toLowerCase()} and why.`;

  return {
    // Use site brand consistently in Google results
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

function Section({ section }: { section: PageDoc["sections"][number] }) {
  switch (section.type) {
    case "persona_fit":
      return (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          <p className="text-base leading-7">{section.content}</p>
        </section>
      );

    case "x_wins":
    case "y_wins":
      return (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          <ul className="space-y-3 list-disc pl-5">
            {section.bullets.map((b, i) => (
              <li key={i}>
                <div className="font-medium">{b.point}</div>
                <div className="text-sm leading-6 opacity-80">
                  {b.why_it_matters}
                </div>
              </li>
            ))}
          </ul>
        </section>
      );

    case "failure_modes":
      return (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          <div className="space-y-4">
            {section.items.map((it, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="text-sm uppercase tracking-wide opacity-70">
                  {it.tool === "x" ? "Option X" : "Option Y"}
                </div>
                <div className="mt-2 font-medium">Fails when</div>
                <div className="text-sm leading-6 opacity-85">
                  {it.fails_when}
                </div>
                <div className="mt-3 font-medium">What to do instead</div>
                <div className="text-sm leading-6 opacity-85">
                  {it.what_to_do_instead}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "quick_rules":
      return (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          <ul className="space-y-2 list-disc pl-5">
            {section.rules.map((r, i) => (
              <li key={i} className="leading-7">
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

  // Guard against bad slugs / missing JSON
  if (!doc) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold">Comparison not found</h1>
        <p className="opacity-80">
          That page doesn’t exist yet. Go back to the comparisons list.
        </p>
        <Link className="underline underline-offset-4" href="/compare">
          Back to all comparisons
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      {/* FAQ schema for rich results */}
      <FAQJsonLd faqs={doc.faqs} />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>

        <div className="text-sm opacity-75">
          Persona: <span className="font-medium">{doc.persona}</span> · Lens:{" "}
          <span className="font-medium">{doc.constraint_lens}</span>
        </div>

        <div className="rounded-xl border p-5 space-y-2">
          <div className="text-sm uppercase tracking-wide opacity-70">
            Verdict
          </div>
          <p className="leading-7">{doc.verdict.summary}</p>
          <p className="text-sm leading-6 opacity-80">
            <span className="font-medium">Rule:</span>{" "}
            {doc.verdict.decision_rule}
          </p>
        </div>
      </header>

      <div className="space-y-10">
        {doc.sections.map((section, idx) => (
          <Section key={idx} section={section} />
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">FAQs</h2>
        <div className="space-y-4">
          {doc.faqs.map((f, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="font-medium">{f.q}</div>
              <div className="mt-2 text-sm leading-6 opacity-85">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Related comparisons</h2>

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
              <p className="text-sm opacity-75">
                No related comparisons yet.
              </p>
            );
          }

          return (
            <>
              <ul className="list-disc pl-5 space-y-1">
                {items.map(({ rp, relatedSlug, exists }, i) => (
                  <li key={i} className="text-sm leading-6">
                    {exists ? (
                      <Link
                        className="underline underline-offset-4"
                        href={`/compare/${relatedSlug}`}
                      >
                        {rp.x_name} vs {rp.y_name} for {rp.persona}
                      </Link>
                    ) : (
                      <span className="opacity-80">
                        {rp.x_name} vs {rp.y_name} for {rp.persona}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {!anyLinks && (
                <p className="text-xs opacity-70">
                  Related pages will become clickable as you publish more comparisons.
                </p>
              )}
            </>
          );
        })()}
      </section>
    </main>
  );
}


