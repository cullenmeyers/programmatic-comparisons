import type { Metadata } from "next";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { loadAllSystemDocs } from "@/lib/system";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "System Signals | Decision Clarities",
  description:
    "Public architecture signals: invariants, boundaries, and structural deltas that govern the engine.",
};

function formatDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export default function SystemIndexPage() {
  const docs = loadAllSystemDocs();
  const architecture = docs.filter((doc) => doc.type === "architecture");
  const deltas = docs.filter((doc) => doc.type === "delta");

  return (
    <main className="site-container page-shell content-stack">
      <header className="max-w-4xl space-y-5">
        <p className="text-xs uppercase tracking-[0.18em] text-black/55">Public signal</p>
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          System architecture
        </h1>
        <p className="max-w-3xl text-base leading-7 text-black/70">
          These pages define the rules that keep outputs deterministic: invariants,
          governance boundaries, and structural updates.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-black/15 px-3 py-1.5 text-black/75">
            {architecture.length} architecture
          </span>
          <span className="rounded-full border border-black/15 px-3 py-1.5 text-black/75">
            {deltas.length} deltas
          </span>
        </div>
      </header>

      <Card className="max-w-4xl bg-black/[0.02]">
        <p className="text-sm leading-6 text-black/70">
          Read these as governance docs, not product copy. If a comparison or tool
          conflicts with a signal here, the signal wins.
        </p>
      </Card>

      {docs.length === 0 ? (
        <Card className="max-w-4xl">
          <p className="text-black/70">No system notes published yet.</p>
        </Card>
      ) : (
        <div className="content-stack gap-8 max-w-4xl">
          {architecture.length > 0 ? (
            <section className="space-y-4">
              <SectionHeading
                title="Architecture signals"
                subtitle="Permanent invariants and boundaries that all generation must obey."
              />
              <div className="space-y-3">
                {architecture.map((doc) => {
                  const stamp = formatDate(doc.date || doc.updated);
                  return (
                    <Card key={doc.slug} className="space-y-3">
                      <p className="text-xs uppercase tracking-wide text-black/55">
                        Architecture{stamp ? ` | ${stamp}` : ""}
                      </p>
                      <Link
                        href={`/system/${doc.slug}`}
                        className="text-lg font-semibold tracking-tight text-black hover:underline"
                      >
                        {doc.title}
                      </Link>
                      {doc.summary ? (
                        <p className="text-sm leading-6 text-black/70">{doc.summary}</p>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}

          {deltas.length > 0 ? (
            <section className="space-y-4">
              <SectionHeading
                title="Structural deltas"
                subtitle="Changes to the system contract over time."
              />
              <div className="space-y-3">
                {deltas.map((doc) => {
                  const stamp = formatDate(doc.date || doc.updated);
                  return (
                    <Card key={doc.slug} className="space-y-3">
                      <p className="text-xs uppercase tracking-wide text-black/55">
                        Delta{stamp ? ` | ${stamp}` : ""}
                      </p>
                      <Link
                        href={`/system/${doc.slug}`}
                        className="text-lg font-semibold tracking-tight text-black hover:underline"
                      >
                        {doc.title}
                      </Link>
                      {doc.summary ? (
                        <p className="text-sm leading-6 text-black/70">{doc.summary}</p>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <div className="text-sm">
        <ButtonLink href="/compare" variant="ghost" className="px-0 py-0">
          Back to comparisons
        </ButtonLink>
      </div>
    </main>
  );
}
