import type { Metadata } from "next";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import PairGateFromCategoryGate from "@/components/gates/PairGateFromCategoryGate";
import {
  getPageCategoryLabel,
  getPageCategorySlug,
  getToolNamesFromDoc,
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

function getCategory(doc: PageDoc): string {
  return getPageCategoryLabel(doc);
}

function firstSentence(text: string) {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : trimmed;
}

function normalizeSentence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function deriveOneSecondSummary(
  winnerLabel: string,
  doc: PageDoc,
  xName: string,
  yName: string
) {
  const verdictLead = firstSentence(doc.verdict.summary);
  const winnerLead = new RegExp(`^${escapeRegex(winnerLabel)} wins for\\s+`, "i");

  if (winnerLead.test(verdictLead)) {
    return normalizeSentence(`Best for ${verdictLead.replace(winnerLead, "")}`);
  }

  const winnerSection = doc.sections.find((section) =>
    doc.verdict.winner === "x" ? section.type === "x_wins" : section.type === "y_wins"
  );
  const winnerBullet =
    winnerSection?.type === "x_wins" || winnerSection?.type === "y_wins"
      ? winnerSection.bullets[0]?.point
      : "";

  if (winnerBullet) {
    return normalizeSentence(
      `Best for ${winnerBullet.charAt(0).toLowerCase()}${winnerBullet.slice(1)}`
    );
  }

  const personaFit = doc.sections.find((section) => section.type === "persona_fit");
  if (personaFit) {
    const headingPrefix = new RegExp(
      `^Why\\s+${escapeRegex(winnerLabel)}\\s+fits\\s+`,
      "i"
    );
    if (headingPrefix.test(personaFit.heading)) {
      return normalizeSentence(
        `Best for ${personaFit.heading.replace(headingPrefix, "")}`
      );
    }

    const toolSpecificContent = firstSentence(personaFit.content)
      .replace(new RegExp(`^${escapeRegex(xName)}\\s+`, "i"), "")
      .replace(new RegExp(`^${escapeRegex(yName)}\\s+`, "i"), "");

    if (toolSpecificContent) {
      return normalizeSentence(
        `Best for ${toolSpecificContent.charAt(0).toLowerCase()}${toolSpecificContent.slice(1)}`
      );
    }
  }

  return normalizeSentence(
    `Best for ${doc.persona.toLowerCase()}s who need the lower-failure option here`
  );
}

function deriveOneSecondReason(doc: PageDoc) {
  const decisionRule = firstSentence(doc.verdict.decision_rule);
  if (decisionRule) {
    const match = decisionRule.match(/^If\s+(.+),\s+(.+?)\s+fails first[.!?]?$/i);
    if (match) {
      return normalizeSentence(`${match[2]} fails first because ${match[1]}`);
    }

    return normalizeSentence(decisionRule);
  }

  const failureModes = doc.sections.find((section) => section.type === "failure_modes");
  const losingTool =
    doc.verdict.winner === "x" ? "y" : doc.verdict.winner === "y" ? "x" : null;
  const losingFailure = failureModes?.items.find((item) => item.tool === losingTool);

  return normalizeSentence(
    losingFailure?.fails_when ?? "The other option fails first under this constraint"
  );
}

function getOneSecondVerdict(doc: PageDoc, xName: string, yName: string) {
  if (doc.oneSecondVerdict) {
    return doc.oneSecondVerdict;
  }

  const winnerLabel =
    doc.verdict.winner === "x" ? xName : doc.verdict.winner === "y" ? yName : "It depends";

  return {
    winnerLabel,
    summary: deriveOneSecondSummary(winnerLabel, doc, xName, yName),
    reason: deriveOneSecondReason(doc),
  };
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
    case "edge_case":
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

    default: {
      const _exhaustive: never = section;
      void _exhaustive;
      return null;
    }
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

  const { xName, yName } = getToolNamesFromDoc(doc);
  const category = getCategory(doc);
  const categorySlug = getPageCategorySlug(doc);
  const oneSecondVerdict = getOneSecondVerdict(doc, xName, yName);
  const maybeGateFields = doc as PageDoc & {
    categorySlug?: string;
    constraintSlug?: string;
  };

  return (
    <main className="site-container page-shell content-stack max-w-4xl">
      <FAQJsonLd faqs={doc.faqs} />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          All comparisons
        </ButtonLink>
        {categorySlug ? (
          <ButtonLink href={`/${categorySlug}`} variant="ghost" className="px-0 py-0">
            {category}
          </ButtonLink>
        ) : null}
      </div>

      <header className="content-stack gap-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-black/55">
            Category:{" "}
            {categorySlug ? (
              <Link
                href={`/${categorySlug}`}
                className="normal-case font-medium text-black/70 hover:text-black"
              >
                {category}
              </Link>
            ) : (
              <span className="normal-case font-medium text-black/70">{category}</span>
            )}
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            {doc.title}
          </h1>
          <p className="text-sm text-black/60">
            Persona: <span className="font-medium text-black/75">{doc.persona}</span> | Focus:{" "}
            <span className="font-medium text-black/75">{doc.constraint_lens}</span>
          </p>
        </div>

        <Card className="space-y-3 border-black/15 bg-black/[0.03]">
          <p className="text-sm uppercase tracking-wide text-black/55">
            1-Second Verdict
          </p>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">
              Best choice
            </p>
            <p className="text-2xl font-semibold tracking-tight text-black">
              {oneSecondVerdict.winnerLabel}
            </p>
          </div>
          <p className="text-base leading-7 text-black/85">{oneSecondVerdict.summary}</p>
          <p className="text-sm leading-6 text-black/65">{oneSecondVerdict.reason}</p>
        </Card>

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
          const currentCategorySlug = getPageCategorySlug(doc);

          const items = (doc.related_pages || []).flatMap((relatedPage) => {
            const relatedSlug = slugifyCompare(
              relatedPage.x_name,
              relatedPage.y_name,
              relatedPage.persona
            );
            const exists = existing.has(relatedSlug);
            if (exists && currentCategorySlug) {
              const relatedDoc = loadPageBySlug(relatedSlug);
              if (relatedDoc && getPageCategorySlug(relatedDoc) !== currentCategorySlug) {
                return [];
              }
            }
            return [{ relatedPage, relatedSlug, exists }];
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
