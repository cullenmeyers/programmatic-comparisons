import type { Metadata } from "next";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import GatesPanel from "@/components/gates/GatesPanel";
import { getGatesForDoc } from "@/lib/gates/selector";
import PairGateFromCategoryGate from "@/components/gates/PairGateFromCategoryGate";
import {
  loadPageBySlug,
  listPageSlugs,
  slugifyCompare,
  type PageDoc,
} from "@/lib/pages";

type Params = { slug: string };
type Persona =
  | "Beginner"
  | "Solo user"
  | "Student"
  | "Busy professional"
  | "Power user"
  | "Non-technical user"
  | "Minimalist";

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
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
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

function getToolNames(doc: PageDoc): { xName: string; yName: string } {
  const maybe = doc as unknown as {
    x_name?: string;
    y_name?: string;
    title: string;
  };

  if (maybe.x_name?.trim() && maybe.y_name?.trim()) {
    return { xName: maybe.x_name.trim(), yName: maybe.y_name.trim() };
  }

  const title = doc.title || "";
  const beforeFor = title.split(" for ")[0] ?? title;
  const parts = beforeFor.split(" vs ");

  const xName = (parts[0] ?? "Option X").trim() || "Option X";
  const yName = (parts[1] ?? "Option Y").trim() || "Option Y";

  return { xName, yName };
}

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
          <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
          <p className="text-base leading-7 text-black/80">{section.content}</p>
        </section>
      );

    case "x_wins":
    case "y_wins":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
          <ul className="list-disc space-y-4 pl-5">
            {section.bullets.map((bullet, index) => (
              <li key={index}>
                <div className="font-medium">{bullet.point}</div>
                <div className="text-sm leading-6 text-black/70">
                  {bullet.why_it_matters}
                </div>
              </li>
            ))}
          </ul>
        </section>
      );

    case "failure_modes":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
          <div className="space-y-4">
            {section.items.map((item, index) => {
              const toolLabel = item.tool === "x" ? xName : yName;
              const optionLabel = item.tool === "x" ? "Option X" : "Option Y";

              return (
                <Card key={index} className="space-y-3">
                  <div className="text-sm uppercase tracking-wide text-black/55">
                    {toolLabel}{" "}
                    <span className="normal-case text-black/60">({optionLabel})</span>
                  </div>
                  <div>
                    <div className="font-medium">Fails when</div>
                    <p className="text-sm leading-6 text-black/75">{item.fails_when}</p>
                  </div>
                  <div>
                    <div className="font-medium">What to do instead</div>
                    <p className="text-sm leading-6 text-black/75">
                      {item.what_to_do_instead}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      );

    case "quick_rules":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
          <ul className="list-disc space-y-2.5 pl-5">
            {section.rules.map((rule, index) => (
              <li key={index} className="leading-7 text-black/85">
                {rule}
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
      <main className="site-container page-shell content-stack">
        <h1 className="text-2xl font-semibold tracking-tight">Comparison not found</h1>
        <p className="text-black/70">
          That page does not exist yet. Go back to the comparisons list.
        </p>
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </main>
    );
  }

  const { xName, yName } = getToolNames(doc);
  const category = getCategory(doc);
  const gateIds = getGatesForDoc(doc);
  const maybeGateFields = doc as PageDoc & {
    categorySlug?: string;
    constraintSlug?: string;
  };

  return (
    <main className="site-container page-shell content-stack max-w-4xl">
      <FAQJsonLd faqs={doc.faqs} />

      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
      </div>

      <header className="content-stack gap-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-black/55">
            Category:{" "}
            <span className="normal-case font-medium text-black/70">{category}</span>
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            {doc.title}
          </h1>
          <p className="text-sm text-black/60">
            Persona: <span className="font-medium text-black/75">{doc.persona}</span> ·
            Focus:{" "}
            <span className="font-medium text-black/75">{doc.constraint_lens}</span>
          </p>
        </div>

        <Card className="space-y-3 bg-black/[0.02]">
          <p className="text-sm uppercase tracking-wide text-black/55">Verdict</p>
          <p className="leading-7 text-black/85">{doc.verdict.summary}</p>
          <p className="text-sm leading-6 text-black/65">
            <span className="font-medium text-black/75">Rule:</span>{" "}
            {doc.verdict.decision_rule}
          </p>
        </Card>

        <PairGateFromCategoryGate
          categorySlug={maybeGateFields.categorySlug}
          constraintSlug={maybeGateFields.constraintSlug}
          xName={xName}
          yName={yName}
        />

        <GatesPanel
          gateIds={gateIds}
          xName={xName}
          yName={yName}
          winner={doc.verdict.winner}
          decisionRule={doc.verdict.decision_rule}
          persona={doc.persona as Persona}
          defaultOpen={false}
        />
      </header>

      <div className="content-stack max-w-3xl">
        {doc.sections.map((section, index) => (
          <Section key={index} section={section} xName={xName} yName={yName} />
        ))}
      </div>

      <section className="content-stack gap-4 max-w-3xl">
        <SectionHeading title="FAQs" />
        <div className="space-y-4">
          {doc.faqs.map((faq, index) => (
            <Card key={index}>
              <p className="font-medium text-black">{faq.q}</p>
              <p className="mt-2 text-sm leading-6 text-black/75">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="content-stack gap-4 max-w-3xl">
        <SectionHeading title="Related comparisons" />
        {(() => {
          const existing = new Set(listPageSlugs());

          const items = (doc.related_pages || []).map((relatedPage) => {
            const relatedSlug = slugifyCompare(
              relatedPage.x_name,
              relatedPage.y_name,
              relatedPage.persona
            );
            const exists = existing.has(relatedSlug);
            return { relatedPage, relatedSlug, exists };
          });

          const anyLinks = items.some((item) => item.exists);

          if (items.length === 0) {
            return <p className="text-sm text-black/60">No related comparisons yet.</p>;
          }

          return (
            <Card>
              <ul className="list-disc space-y-2 pl-5">
                {items.map(({ relatedPage, relatedSlug, exists }, index) => (
                  <li key={index} className="text-sm leading-6">
                    {exists ? (
                      <Link
                        className="text-black/80 hover:text-black hover:underline"
                        href={`/compare/${relatedSlug}`}
                      >
                        {relatedPage.x_name} vs {relatedPage.y_name} for{" "}
                        {relatedPage.persona}
                      </Link>
                    ) : (
                      <span className="text-black/60">
                        {relatedPage.x_name} vs {relatedPage.y_name} for{" "}
                        {relatedPage.persona}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {!anyLinks && (
                <p className="mt-4 text-xs text-black/55">
                  Related pages become clickable as you publish more comparisons.
                </p>
              )}
            </Card>
          );
        })()}
      </section>
    </main>
  );
}
